let pageTitle = document.title;
let pageContent = document.body.innerText;

chrome.runtime.sendMessage({
  action: 'storePageContent',
  data: { pageTitle, pageContent }
}, function(response) {
  console.log(response);
});
