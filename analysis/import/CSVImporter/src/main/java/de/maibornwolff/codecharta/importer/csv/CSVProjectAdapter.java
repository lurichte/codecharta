package de.maibornwolff.codecharta.importer.csv;

import com.univocity.parsers.csv.CsvParser;
import com.univocity.parsers.csv.CsvParserSettings;
import de.maibornwolff.codecharta.model.Node;
import de.maibornwolff.codecharta.model.NodeType;
import de.maibornwolff.codecharta.model.Project;
import de.maibornwolff.codecharta.nodeinserter.FileSystemPath;
import de.maibornwolff.codecharta.nodeinserter.NodeInserter;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

public class CSVProjectAdapter extends Project {
    public static final String ROOT = "root";
    private final char pathSeparator;
    private final char csvDelimiter;

    private CSVHeader header;

    public CSVProjectAdapter(String projectName, char pathSeparator, char csvDelimiter) {
        super(projectName);
        this.pathSeparator = pathSeparator;
        this.csvDelimiter = csvDelimiter;
        this.getNodes().add(new Node(ROOT, NodeType.Folder));
    }

    public void addProjectFromCsv(InputStream inStream) {
        addProjectFromCsv(inStream, StringReplacer.TRIVIAL);
    }

    public void addProjectFromCsv(InputStream inStream, StringReplacer stringReplacer) {
        CsvParser parser = createParser(inStream);
        String[] oldHeader = parser.parseNext();
        header = new CSVHeader(stringReplacer.replace(oldHeader));
        parseContent(parser);
        parser.stopParsing();
    }

    private void parseContent(CsvParser parser) {
        String[] row;
        while ((row = parser.parseNext()) != null) {
            insertNodeForRow(row);
        }
    }

    private CsvParser createParser(InputStream inStream) {
        CsvParserSettings parserSettings = new CsvParserSettings();
        parserSettings.getFormat().setDelimiter(csvDelimiter);

        CsvParser parser = new CsvParser(parserSettings);
        parser.beginParsing(new InputStreamReader(inStream, StandardCharsets.UTF_8));
        return parser;
    }

    private void insertNodeForRow(String[] rawRow) {
        try {
            CSVRow row = new CSVRow(rawRow, header, pathSeparator);
            Node node = new Node(row.getFileName(), NodeType.File, row.getAttributes());
            NodeInserter.insertByPath(this, new FileSystemPath(row.getFolderWithFile().replace(pathSeparator, '/')), node);
        } catch (IllegalArgumentException e) {
            System.err.println("Ignoring " + e.getMessage());
        }
    }


}
