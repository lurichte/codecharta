package de.maibornwolff.codecharta.importer.scmlogparser.input.metrics

import de.maibornwolff.codecharta.importer.scmlogparser.input.Commit
import de.maibornwolff.codecharta.importer.scmlogparser.input.Modification
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import java.time.OffsetDateTime
import java.util.*
import java.util.stream.Collectors

class HighlyCoupledFilesTest {

    private val FILENAME = "filename"
    private val COUPLED_FILE1 = "coupledfilename1"
    private val COUPLED_FILE2 = "coupledfilename2"

    @Test
    fun should_have_initial_value_zero() {
        // when
        val metric = HighlyCoupledFiles()

        // then
        assertThat(metric.value()).isEqualTo(0L)
    }

    @Test
    fun should_not_increase_on_commits_of_same_file() {
        // given
        val metric = HighlyCoupledFiles()

        // when
        registerModifications(metric, FILENAME)

        // then
        assertThat(metric.value()).isEqualTo(0L)
    }

    @Test
    fun should_not_increase_on_one_commit_of_several_files() {
        // given
        val metric = HighlyCoupledFiles()

        // when
        registerModifications(metric, FILENAME, COUPLED_FILE1)

        // then
        assertThat(metric.value()).isEqualTo(0L)
    }

    @Test
    fun should_increase_on_at_five_commits_of_same_files() {
        // given
        val metric = HighlyCoupledFiles()

        // when
        for (i in 0..4) {
            registerModifications(metric, FILENAME, COUPLED_FILE1)
        }

        // then
        assertThat(metric.value()).isEqualTo(1L)
    }

    @Test
    fun should_increase() {
        // given
        val metric = HighlyCoupledFiles()

        // when
        registerModifications(metric, FILENAME, COUPLED_FILE1)
        registerModifications(metric, FILENAME, COUPLED_FILE2)
        registerModifications(metric, FILENAME, COUPLED_FILE1)
        registerModifications(metric, FILENAME, COUPLED_FILE1)
        registerModifications(metric, FILENAME)

        // then
        assertThat(metric.value()).isEqualTo(1L)
    }

    private fun registerModifications(metric: Metric, vararg filenames: String) {
        val modificationList = Arrays.stream(filenames)
                .map<Modification>({ Modification(it) })
                .collect(Collectors.toList())

        val commit = Commit("author", modificationList, OffsetDateTime.now())
        metric.registerCommit(commit)

        modificationList.stream()
                .filter { mod -> FILENAME == mod.filename }
                .findFirst()
                .ifPresent({ metric.registerModification(it) })
    }
}