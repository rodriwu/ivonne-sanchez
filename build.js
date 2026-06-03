const fs   = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Flatten nested object: { hero: { name: "X" } } → { "hero.name": "X" }
function flatten(obj, prefix) {
  prefix = prefix || '';
  return Object.entries(obj).reduce(function(acc, entry) {
    var key = entry[0];
    var val = entry[1];
    var fullKey = prefix ? prefix + '.' + key : key;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(acc, flatten(val, fullKey));
    } else {
      acc[fullKey] = val == null ? '' : String(val);
    }
    return acc;
  }, {});
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

var template = fs.readFileSync('index.template.html', 'utf8');
var raw      = yaml.load(fs.readFileSync('_data/content.yml', 'utf8'));
var content  = flatten(raw);

var html = template;

// Pass 1: {{{key}}} → raw value (HTML fields with tags)
Object.entries(content).forEach(function(entry) {
  var key = entry[0];
  var val = entry[1];
  html = html.replace(new RegExp('\\{\\{\\{' + escapeRegex(key) + '\\}\\}\\}', 'g'), val);
});

// Pass 2: {{key}} → HTML-escaped value (plain text fields)
Object.entries(content).forEach(function(entry) {
  var key = entry[0];
  var val = entry[1];
  html = html.replace(new RegExp('\\{\\{' + escapeRegex(key) + '\\}\\}', 'g'), escapeHtml(val));
});

// Ensure output dir exists
fs.mkdirSync('public', { recursive: true });
fs.mkdirSync('public/admin', { recursive: true });

// Write built HTML
fs.writeFileSync('public/index.html', html);

// Copy static assets
['ivonne.jpg', 'CNAME'].forEach(function(file) {
  if (fs.existsSync(file)) fs.copyFileSync(file, 'public/' + file);
});

// Copy admin files
fs.readdirSync('admin').forEach(function(file) {
  fs.copyFileSync(path.join('admin', file), path.join('public/admin', file));
});

console.log('Build complete → public/');
