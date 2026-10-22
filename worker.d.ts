// Types for worker.js, which publish_pages.py (bookchaowalit/career-job-scraper) generates.
// worker.js embeds the rendered pages and the route table; src/worker.ts wraps it.
declare const generated: {
  fetch(request: Request): Promise<Response>;
};
export default generated;
