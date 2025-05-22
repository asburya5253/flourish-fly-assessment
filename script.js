const spreadsheetId = "1dA_WEldvo9bBA2IQ6H9N4fSSZZCMBpAu";
const sheetName = "G1_OA";  
const range = `${sheetName}!A2:H`; 
const apiKey = "AIzaSyBI2rGFfbo18U2UIkFT6NlDTVTP-7xODOc";

function init() {
  fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Sheet data:", data);
      // Your code to handle the data goes here
    })
    .catch(error => {
      console.error("Google Sheets API Error:", error);
    });
}

init();  // Call it here
