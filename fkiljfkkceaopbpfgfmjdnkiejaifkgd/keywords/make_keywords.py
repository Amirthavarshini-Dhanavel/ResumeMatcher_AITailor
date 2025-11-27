import os
import csv
import argparse

# ex.
# python3 make_keywords.py --input-file=swe_essentials.csv --output-file=swe_essentials.js
# python3 make_keywords.py --input-file=swe_nice_to_haves.csv --output-file=swe_nice_to_haves.js

# master:
# python3 make_keywords.py --generate-master=true --output-file=general_keywords.js


if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        description='options for generating keywords list', formatter_class=argparse.ArgumentDefaultsHelpFormatter)

    parser.add_argument(
        "--generate-master", type=bool
    )
    parser.add_argument(
        "--output-file", type=str
    )

    parser.add_argument(
        "--input-file", type=str
    )

    args = parser.parse_args()

    all_keywords = set()

    if args.generate_master:
        files = set([f for f in os.listdir('.') if os.path.isfile(f) and f[-4:] == '.csv' and f != 'synonyms.csv'])

        for file in files:
            with open(file) as csv_file:
                reader = csv.reader(csv_file)
                keywords = [l[0].lower().strip() for l in list(reader)[0:]]
                all_keywords.update(keywords)
    else:
        file = args.input_file

        with open(file) as csv_file:
            reader = csv.reader(csv_file)
            keywords = [l[0].lower().strip() for l in list(reader)[0:]]
            all_keywords.update(keywords)
    # print("merging keywords from " + file)

    # correct for suffixes
    suffixes = ["ing", "d", "ed", "s"]
    suffix_corrected_keywords = []

    for keyword in all_keywords:
        is_suffixed = False;
        for suffix in suffixes:
            if keyword[-len(suffix):] == suffix:
                without_suffix = keyword[:-len(suffix)]
                if without_suffix in all_keywords:
                    is_suffixed = True
                    print("not including keyword '{}' is suffixed".format(keyword))

        if not is_suffixed:
            suffix_corrected_keywords.append(keyword)


    all_keywords = sorted(suffix_corrected_keywords)

    full_string = """
    [{}]
    """.format(
        "".join(["    \"{}\",\n".format(k) for k in all_keywords])
    )

    if args.input_file:
        full_string = f"""var {args.input_file[:-4]} =
            {full_string}
            export {{ {args.input_file[:-4]} }}
            """
    else:
        full_string = f"""var general_keywords =
            {full_string}
            export {{ general_keywords }}
            """

    with open(args.output_file, 'w') as f:
        f.write(full_string)
