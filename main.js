const endpointUrl = 'https://www.googleapis.com/books/v1/volumes';

function formatQueryParams(params) {
    const queryParamItems = Object.keys(params).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
    return queryParamItems.join('&');
}

function displayResults(responseJson) {
    console.log(responseJson);
    $('#js-search-results').empty();
}

function getResultsData(query) {
    const params = {
        q: query
    }
    const queryString = formatQueryParams(params);
    const url = `${endpointUrl}?${queryString}`;
    fetch(url)
    .then(response => response.json())
    .then(responseJson => displayResults(responseJson))
    .catch(err => $('#js-error-message').text(`Something went wrong: ${err.message}`));
}

function watchForm() {
    $('#js-search-form').submit(event => {
        event.preventDefault();
        const searchTerm = $('#js-search-term').val();
        getResultsData(searchTerm);
    })
}

$(watchForm);