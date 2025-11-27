import os
import csv

synonyms = []
with open('synonyms.csv') as csv_file:
    lines = [l.strip() for l in csv_file.readlines()]

lines = [
	[synonym.lower() for synonym in l.split(',') if synonym]
	for l in lines]
lines = [
	"    [{}],\n".format(
		",".join(["\"{}\"".format(synonym) for synonym in line])
	)
	for line in lines
]
lines = "".join(lines)

full_string = """
var synonyms = [
{}]

export {{ synonyms }}
""".format(lines)

with open('synonyms_list.js', 'w') as f:
    f.write(full_string)
