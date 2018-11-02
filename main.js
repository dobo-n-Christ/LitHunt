const apiKey = 'AIzaSyCQurf0qBxp4GGCYCcO4xOQ9kakqoWEZQ4';
const endpointUrl = 'https://www.googleapis.com/books/v1/volumes';

function formatQueryParams(params) {
    const queryParamItems = Object.keys(params).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params.key)}`);
    return queryParamItems.join('&');
}

function displayResults(responseJson) {
    console.log(responseJson);
    $('#js-search-results').empty();
}

function getResultsData(searchTerm) {
    const params = {
        q: searchTerm,
        key: apiKey
    }
    const queryString = formatQueryParams(params);
    const url = `${endpointUrl}?${queryString}`;
    fetch(url)
    .then(response => response.json())
    .then(responseJson => displayResults(responseJson))
    .catch(err => $('#js-error-message').text(`Something went wrong: ${err.message}`));
}

// function getResultsData(query, callback) {
//     const settings = {
//         url: bookSearchUrl,
//         data: {
//             key: apiKey,
//         },
//         dataType: 'jsonp',
//         success: callback
//     };
//     $.ajax(settings);
// }

function watchForm() {
    $('#js-search-form').submit(event => {
        event.preventDefault();
        const searchTerm = $('#js-search-term').val();
        getResultsData(searchTerm);
    })
}

$(watchForm);