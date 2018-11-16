const endpointUrl = 'https://www.googleapis.com/books/v1/volumes';

function formatQueryParams(params) {
    const queryParamItems = Object.keys(params).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
    return queryParamItems.join('&');
}

function displayResultsTotal(responseJson) {
    $('#js-search-results-total').prop('hidden', false).html(`${responseJson.totalItems} results`);
}

function generateThumbnailElement(item, thumbnail) {
    return `
        <a href="${item.volumeInfo.infoLink}" class="result-thumbnail"><img src="${thumbnail}" alt="Image of front cover of text used as thumbnail link to text information page"></a>
        `;
}

function handleThumbnail(item) {
    const imageData = item.volumeInfo.imageLinks;
    if (imageData) {
        const thumbnail = imageData.smallThumbnail;
        const thumbnailElement = generateThumbnailElement(item, thumbnail);
        return thumbnailElement;
    }
    else {
        const thumbnail = "https://books.google.de/googlebooks/images/no_cover_thumb.gif";
        const thumbnailElement = generateThumbnailElement(item, thumbnail);
        return thumbnailElement;
    }
}

function handleAuthor(item) {
    const authorData = item.volumeInfo.authors;
    if (Array.isArray(authorData) && authorData.length > 1) {
        return authorData.join(', ');
    }
    else if (Array.isArray(authorData)) {
        return authorData[0];
    }
    else if (authorData) {
        return authorData;
    }
    else {
        return '';
    }

}

function handlePublisher(item) {
    const publisherData = item.volumeInfo.publisher;
    if (publisherData) {
        return publisherData;
    }
    return '';
}

function checkDateFormat(date) {
    if (date.length > 4) {
        return date.slice(0, 4);
    }
    return date;
}

function handleDatePublished(item) {
    const date = item.volumeInfo.publishedDate;
    if (date) {
        const year = checkDateFormat(date);
        return year;
    }
    return '';
}

function handleSummary(item) {
    if (item.searchInfo) {
        return `
        <p class="result-summary">${item.searchInfo.textSnippet}</p>
        `;
    }
    else if (item.volumeInfo.description) {
        return `
        <p class="result-summary">${item.volumeInfo.description}</p>
        `;
    }
    else {
        return '';
    }
}

function checkForItem(item) {
    if (item) {
        return item;
    }
}

function generatePubDataElement(pubData) {
    return `
        <span class="publication-data">${pubData}</span>
        `;
}

function handlePubData(author, publisher, datePublished) {
    const pubData = [author, publisher, datePublished];
    const filteredPubData = pubData.filter(checkForItem);
    const pubElementArray = filteredPubData.map(generatePubDataElement);
    if (pubElementArray.length > 1) {
        return pubElementArray.join('<span> - </span>');
    }
    return pubElementArray[0];
}

function handleItemData(item) {
    if (item.volumeInfo) {
        const thumbnail = handleThumbnail(item);
        const author = handleAuthor(item);
        const publisher = handlePublisher(item);
        const datePublished = handleDatePublished(item);
        const pubData = handlePubData(author, publisher, datePublished);
        const summary = handleSummary(item);
        return `
        <li class="result-element">
            <article>
                <h3 class="result-title">
                    <a href="${item.volumeInfo.infoLink}">${item.volumeInfo.title}</a>
                </h3>
                <cite class="result-url">${item.volumeInfo.infoLink}</cite><br>
                ${thumbnail}
                <div class="result-info">
                    ${pubData}
                </div>
                ${summary}
            </article>
        </li>
        `;
    }
    else {
        return i++;
    };
}

function generateResultElement(response, i) {
    const item = response.items[i];
    const resultElement = handleItemData(item);
    return resultElement;
}

function displayResults(responseJson) {
    $('#js-error-message').prop('hidden', true).empty();
    $('#js-search-results-list').empty();
    displayResultsTotal(responseJson);
    for (let i = 0; i < responseJson.items.length; i++) {
        const resultElement = generateResultElement(responseJson, i);
        const listContainer = $('#js-search-results-list');
        listContainer.parent().prop('hidden', false);
		listContainer.append(resultElement);
    }
}

function handleError(err) {
    $('#js-search-results-total').empty().prop('hidden', true);
    $('#js-search-results-list').empty().parent().prop('hidden', true);
    $('#js-error-message').prop('hidden', false).text(`Something went wrong: ${err.message}`)
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
    .catch(handleError);
}

function watchForm() {
    $('#js-search-form').submit(event => {
        event.preventDefault();
        const searchTerm = $('#js-search-term').val();
        getResultsData(searchTerm);
    })
}

$(watchForm);