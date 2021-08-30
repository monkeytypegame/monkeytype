package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"path"
	"strings"
	"unicode"

	"github.com/pkg/errors"
)

// GenerateCorpus generates a corpus of words from a single file
//
func GenerateCorpus(fileName string) (map[string]int, error) {

	bytes, err := ioutil.ReadFile(fileName)
	if err != nil {
		return nil, err
	}

	words := strings.Fields(string(bytes))
	result := make(map[string]int)
	for _, word := range words {

		cleaned := clean(word)
		if cleaned == "" {
			continue
		}
		result[cleaned]++
	}

	return result, nil
}

// GenerateCorpusFromFolder generates a corpus of words from all the files found in a folder
//
func GenerateCorpusFromFolder(folderName string) (map[string]int, error) {

	files, err := ioutil.ReadDir(folderName)
	if err != nil {
		return nil, errors.Wrapf(err, "could not open directory %v", folderName)
	}

	result := make(map[string]int)

	for _, ff := range files {
		if ff.IsDir() {
			continue
		}

		filename := path.Join(folderName, ff.Name())
		corpus, err := GenerateCorpus(filename)
		if err != nil {
			return nil, errors.Wrapf(err, "could not open file %v", filename)
		}
		for word, count := range corpus {
			result[word] += count
		}
	}

	return result, nil
}

// clean cleans a word up, removing punctuation and converting to lowercase
//
func clean(word string) string {

	result := word
	result = strings.TrimFunc(result, func(r rune) bool { return !unicode.IsLetter(r) })
	result = strings.ToLower(result)
	if strings.ContainsAny(result, "0123456789áéíóúñ") {
		return ""
	}
	return result
}

func main() {

	foldername := `./src`
	corpus, err := GenerateCorpusFromFolder(foldername)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	for word, count := range corpus {
		fmt.Println(word, count)
	}
}
