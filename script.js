const spreadsheetId = "1dA_WEldvo9bBA2IQ6H9N4fSSZZCMBpAu";
const sheetName = "G1_OA";  // <-- define before use

const range = `${sheetName}!A2:L`;  // no quotes around sheetName
const apiKey = "AIzaSyBI2rGFfbo18U2UIkFT6NlDTVTP-7xODOc"; // ✅ replace with your actual API key

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
      // ✅ Do something with the data here
    })
    .catch(error => {
      console.error("Google Sheets API Error:", error);
    });
}

