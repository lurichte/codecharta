package de.maibornwolff.codecharta.importer.sourcecodeparser.sonaranalyzers

import de.maibornwolff.codecharta.importer.sourcecodeparser.NullFileLinesContextFactory
import de.maibornwolff.codecharta.importer.sourcecodeparser.metrics.ProjectMetrics
import org.sonar.api.SonarQubeSide
import org.sonar.api.batch.fs.InputFile
import org.sonar.api.batch.fs.internal.TestInputFileBuilder
import org.sonar.api.batch.rule.CheckFactory
import org.sonar.api.batch.rule.internal.ActiveRulesBuilder
import org.sonar.api.batch.sensor.internal.SensorContextTester
import org.sonar.api.config.internal.MapSettings
import org.sonar.api.internal.SonarRuntimeImpl
import org.sonar.api.issue.NoSonarFilter
import org.sonar.api.rule.RuleKey
import org.sonar.api.server.profile.BuiltInQualityProfilesDefinition
import org.sonar.api.server.rule.RulesDefinition
import org.sonar.api.utils.Version
import org.sonar.java.DefaultJavaResourceLocator
import org.sonar.java.JavaClasspath
import org.sonar.java.JavaTestClasspath
import org.sonar.java.SonarComponents
import org.sonar.java.checks.CheckList
import org.sonar.java.filters.PostAnalysisIssueFilter
import org.sonar.plugins.java.Java
import org.sonar.plugins.java.JavaRulesDefinition
import org.sonar.plugins.java.JavaSonarWayProfile
import org.sonar.plugins.java.JavaSquidSensor
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.PrintStream
import java.nio.charset.StandardCharsets

class JavaSonarAnalyzer: SonarAnalyzer {

    override val FILE_EXTENSION = "java"
    override lateinit var baseDir: File

    private lateinit var javaClasspath: JavaClasspath
    private lateinit var sonarComponents: SonarComponents

    private var activeRules = ActiveRulesBuilder().build()
    private var mapSettings = MapSettings().asConfig()
    private lateinit var issueRepository: RulesDefinition.Repository

    private var totalFiles = 0
    private var analyzedFiles = 0
    private val originalOut = System.out

    constructor(verbose: Boolean = false, searchIssues: Boolean = true): super(verbose, searchIssues) {
        if (searchIssues) {
            setActiveRules()
            createIssueRepository()
        }
    }

    private fun createIssueRepository() {
        val sonarRuntime = SonarRuntimeImpl.forSonarQube(Version.create(7, 3), SonarQubeSide.SERVER)
        val definition = JavaRulesDefinition(mapSettings, sonarRuntime)
        val context = RulesDefinition.Context()
        definition.define(context)
        issueRepository = context.repository("squid")!!
    }

    private fun setActiveRules() {
        val sonarRuntime = SonarRuntimeImpl.forSonarQube(Version.create(7, 3), SonarQubeSide.SERVER)
        val profileDef = JavaSonarWayProfile(sonarRuntime)
        val context = BuiltInQualityProfilesDefinition.Context()
        profileDef.define(context)
        val rules = context.profile("java", "Sonar way").rules()

        val activeRulesBuilder = ActiveRulesBuilder()
        rules.forEach { activeRulesBuilder.create(RuleKey.of(CheckList.REPOSITORY_KEY, it.ruleKey())).activate() }
        activeRules = activeRulesBuilder.build()
    }

    override fun createContext() {
        sensorContext = SensorContextTester.create(baseDir)
        sensorContext.setRuntime(SonarRuntimeImpl.forSonarQube(Version.create(6, 0), SonarQubeSide.SERVER))
        javaClasspath = JavaClasspath(mapSettings, sensorContext.fileSystem())
    }

    override fun buildSonarComponents() {
        val checkFactory = CheckFactory(this.activeRules)
        val javaTestClasspath = JavaTestClasspath(mapSettings, sensorContext.fileSystem())
        val fileLinesContextFactory = NullFileLinesContextFactory()
        sonarComponents = SonarComponents(
                fileLinesContextFactory,
                sensorContext.fileSystem(),
                javaClasspath,
                javaTestClasspath,
                checkFactory
        )
        sonarComponents.setSensorContext(this.sensorContext)
    }

    override fun scanFiles(fileList: List<String>, root: File): ProjectMetrics {
        baseDir = root.absoluteFile
        val projectMetrics = ProjectMetrics()

        analyzedFiles = 0
        totalFiles = fileList.size

        for (file in fileList) {
            printProgressBar(file)
            createContext()
            buildSonarComponents()
            addFileToContext(file)
            executeScan()
            val fileMetrics = retrieveMetrics(file)
            retrieveIssues().forEach { fileMetrics.add(it.key, it.value) }
            projectMetrics.addFileMetricMap(file, fileMetrics)
        }

        System.setOut(originalOut)
        return projectMetrics
    }

    override fun addFileToContext(fileName: String) {
        val inputFile = TestInputFileBuilder.create("moduleKey", fileName)
                .setModuleBaseDir(baseDir.toPath())
                .setCharset(StandardCharsets.UTF_8)
                .setType(InputFile.Type.MAIN)
                .setLanguage(Java.KEY)
                .initMetadata(fileContent(File("$baseDir/$fileName"), StandardCharsets.UTF_8))
                .build()
        sensorContext.fileSystem().add(inputFile)
    }

    override fun executeScan() {
        val javaSquidSensor = JavaSquidSensor(
                sonarComponents,
                sonarComponents.fileSystem,
                DefaultJavaResourceLocator(sonarComponents.fileSystem, javaClasspath),
                mapSettings,
                NoSonarFilter(),
                PostAnalysisIssueFilter(sonarComponents.fileSystem)
        )
        javaSquidSensor.execute(sensorContext)
    }

    private fun retrieveIssues(): HashMap<String, Int> {
        val issues: HashMap<String, Int> = hashMapOf()
        sensorContext.allIssues().forEach {
            val ruleKey = it.ruleKey().rule()
            val type = issueRepository.rule(ruleKey)?.type().toString().toLowerCase()
            println("Found: $type \n with message ${it.primaryLocation().message()}")
            if (issues.containsKey(type)) {
                issues[type] = issues[type]!! + 1
            } else {
                issues[type] = 1
            }
        }
        return issues
    }

    private fun printProgressBar(fileName: String) {
        analyzedFiles += 1
        val percentage = analyzedFiles.toFloat() / totalFiles * 100
        val roundedPercentage = String.format("%.1f", percentage)
        val currentFile = if (fileName.length > 30) ".." + fileName.takeLast(30) else fileName
        val message = "\r Analyzing .java files... $roundedPercentage% ($currentFile)"

        System.setOut(originalOut)
        print(message)

        if (!verbose) System.setOut(PrintStream(ByteArrayOutputStream()))
    }
}