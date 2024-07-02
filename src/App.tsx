import { useState } from "react";
import "./App.css";
import JSZip from "jszip";

function App() {

  /*
   * A handler function to handle input file changes
   */
  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const arrayBuffer = e.target.result;
        JSZip.loadAsync(arrayBuffer).then(async function(zip) {
          // Get the META-INF/container.xml file and parse it to get the root file
          const containerXML = await zip.file("META-INF/container.xml")?.async('string'); 
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(containerXML, "text/xml");
          const rootfile = xmlDoc.documentElement.getElementsByTagName("rootfile")[0].getAttribute("full-path");

          // Get the rootfile
          const contentOpf = await zip.file(rootfile)?.async("string");
          const xmlDoc2 = parser.parseFromString(contentOpf, "text/xml");
          const manifest = xmlDoc2.getElementsByTagName("manifest")[0];
          const items = manifest.getElementsByTagName("item");

          // Collect the HTML files
          let htmlFiles = [];
          for (let i = 0; i < items.length; i++) {
            if (items[i].getAttribute("media-type") === "application/xhtml+xml") {
              htmlFiles.push(items[i].getAttribute("href"));
            }
          }
          return Promise.all(htmlFiles.map(fileName => zip.file(`OEBPS/${fileName}`)?.async("string")));
        }).then(function(htmlFiles) {
          const contentDiv = document.getElementById("content");
          htmlFiles.forEach(function(htmlFile) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(htmlFile, "text/html");
            const body = xmlDoc.getElementsByTagName("body")[0];
            contentDiv.appendChild(document.importNode(body, true));
          });
        }).catch(function(err) {
          console.error("Error reading EPUB file:", err);
        });
      };

      reader.readAsArrayBuffer(file);
    }

  }

  return (
    <>
      <div>
        <h1>Epub-Reader</h1>
        <input
          type="file"
          name="EPUBFile"
          onChange={handleFileSelect}
        />
        <div id="content"></div>
      </div>
    </>
  );
}

export default App;
