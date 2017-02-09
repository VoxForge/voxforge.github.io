pandoc --reference-links -s -f html -t markdown-raw_html-native_divs-native_spans in.html -o middle.md
python3 removeVoxForge.py
