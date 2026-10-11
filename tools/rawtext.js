ObjC.import('PDFKit');
function run(argv){ return $.PDFDocument.alloc.initWithURL($.NSURL.fileURLWithPath(argv[0])).string.js; }
