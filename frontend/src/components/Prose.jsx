// `html` is rendered and sanitised by the Python backend (nh3), never built from user input here.
export default function Prose({ html }) {
  return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
