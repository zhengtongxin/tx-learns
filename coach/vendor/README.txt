Vendored, unmodified libraries (source maps removed) used only by the study coach page, so nothing loads from a third-party script host:
- web-llm 0.2.89 (Apache-2.0): runs an open model in the browser with WebGPU. The model files themselves download from the model host when the reader clicks the download button.
- pdf.js 5.4.149 (Apache-2.0) and its cmaps: reads text from PDFs on the reader's device.
- JSZip 3.10.1 (MIT): opens .pptx files on the reader's device.
File names carry the version; they are cached for a year, so bump the name when updating.
