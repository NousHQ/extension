// let pageTitle = document.title;
// let pageContent = document.body.innerText;
// let pageURL = window.location.href;

// chrome.runtime.sendMessage({
//   action: 'storePageContent',
//   data: { pageTitle, pageContent, pageURL }
// }, function(response) {
//   console.log(response);
// });
// const pageContent = document.body.innerText;
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
      if (request.action === 'getPageContent') {
        var documentClone = document.cloneNode(true);
        var article = new Readability(documentClone).parse();
        var readable = isProbablyReaderable(document)
        console.log(readable);
        let pageContent = document.body.innerText;
        sendResponse(
            {
                content: pageContent,
                readable: readable,
                readability: article
            }
        );
    }
  }
)