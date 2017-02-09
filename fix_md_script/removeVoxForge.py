import re

filename = 'middle.md'
f = open(filename)
w = open("out.md", "w")

w.write("---\n")
w.write("---\n")


inarray = f.readlines()
for line in inarray:
    newline = line.replace('http://www.voxforge.org/home/docs/faq', '')
    newline = newline.replace('../home/docs/faq', '')
    #newline = newline.replace(' \\', '')
    newline = re.sub(r"\s+\\", "", newline)
    w.write(newline)


f.close()
w.close()
