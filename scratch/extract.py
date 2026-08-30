import urllib.request
import re
from html.parser import HTMLParser

class BlogParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_post = False
        self.div_depth = 0
        self.text_content = []
        self.in_pre = False

    def handle_starttag(self, tag, attrs):
        if tag == 'div':
            attrs_dict = dict(attrs)
            if 'class' in attrs_dict and 'post-body' in attrs_dict['class']:
                self.in_post = True
                self.div_depth = 0
            
            if self.in_post:
                self.div_depth += 1
                
        if self.in_post:
            if tag == 'pre':
                self.in_pre = True
                self.text_content.append('\n```\n')
            elif tag in ['h2', 'h3', 'h4']:
                self.text_content.append('\n## ')
            elif tag == 'li':
                self.text_content.append('\n- ')
            elif tag == 'br':
                self.text_content.append('\n')
            elif tag == 'p':
                self.text_content.append('\n\n')

    def handle_endtag(self, tag):
        if self.in_post:
            if tag == 'div':
                self.div_depth -= 1
                if self.div_depth == 0:
                    self.in_post = False
            elif tag == 'pre':
                self.in_pre = False
                self.text_content.append('\n```\n')

    def handle_data(self, data):
        if self.in_post:
            if not self.in_pre:
                data = re.sub(r'\s+', ' ', data)
            self.text_content.append(data)

# Read the local HTML file
with open('C:/Users/Admin/.gemini/antigravity-ide/brain/224193cf-75ec-4b35-9c01-c6e9ce10b692/.system_generated/steps/38/content.md', 'r', encoding='utf-8') as f:
    html = f.read()

parser = BlogParser()
parser.feed(html)
content = "".join(parser.text_content)
content = re.sub(r'\n{3,}', '\n\n', content)
with open('e:/blog_congtc/scratch/extracted.md', 'w', encoding='utf-8') as out:
    out.write(content.strip())
