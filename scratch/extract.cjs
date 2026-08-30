const fs = require('fs');
const html = fs.readFileSync('C:/Users/Admin/.gemini/antigravity-ide/brain/224193cf-75ec-4b35-9c01-c6e9ce10b692/.system_generated/steps/38/content.md', 'utf8');

const startIndex = html.indexOf("<div class='post-body entry-content' id='post-body'>");
if (startIndex !== -1) {
    let content = html.substring(startIndex);
    const endIndex = content.indexOf("<div style='clear: both;'>");
    if (endIndex !== -1) {
        content = content.substring(0, endIndex);
    }
    
    // Remove the style block at the beginning
    content = content.replace(/<style>[\s\S]*?<\/style>/i, '');
    
    // Convert to markdown roughly
    content = content.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n\n');
    content = content.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n\n');
    content = content.replace(/<br\s*\/?>/gi, '\n');
    content = content.replace(/<\/p>/gi, '\n\n');
    content = content.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
    content = content.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (match, p1) => {
        let code = p1.replace(/<[^>]+>/g, ''); // remove internal html tags
        code = code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        return '\n```bash\n' + code.trim() + '\n```\n\n';
    });
    content = content.replace(/<[^>]+>/g, ''); // remove all other tags
    
    // Fix entities
    content = content.replace(/&nbsp;/g, ' ');
    content = content.replace(/&quot;/g, '"');
    content = content.replace(/&lt;/g, '<');
    content = content.replace(/&gt;/g, '>');
    content = content.replace(/&amp;/g, '&');
    
    // Fix multiple empty lines
    content = content.replace(/\n{3,}/g, '\n\n');
    
    console.log(content.trim());
} else {
    console.log("Could not extract content.");
}
