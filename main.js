const googleBooksUrl = 'https://www.googleapis.com/books/v1/volumes';
const goodReadsUrl = 'https://www.goodreads.com/book/isbn/';
let bookResultsArray = [];

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
                    <a href="#" data-book-id="${item.id}" class="result-title">${item.volumeInfo.title}</a>
                </h3>
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

{/* <a href="javascript: displayBookDetail('${item.id}')">${item.volumeInfo.title}</a> */}

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

function returnToSearchResults() {
    $('#js-search-results-total').prop('hidden', false);
    $('#js-search-results-list').parent().prop('hidden', false);
    $('#js-result-content').empty().prop('hidden', true);
}

function generateBookDetail(book) {
    return `
    <a href="#" class="back-to-results">Back to Search Results</a>
    <h3>${book.volumeInfo.title}</h3>
    <div>${handleThumbnail(book)}</div>
    <h4>${handleAuthor(book)}</h4>
    <p>${handlePublisher(book)} ${handleDatePublished(book)}</p>
    <ul>
        <li>${book.volumeInfo.industryIdentifiers[0].type}: ${book.volumeInfo.industryIdentifiers[0].identifier}</li>
        <li>${book.volumeInfo.industryIdentifiers[1].type}: ${book.volumeInfo.industryIdentifiers[1].identifier}</li>
    </ul>
    <p>${book.volumeInfo.description}</p>
    <a href="${book.volumeInfo.previewLink}" target="_blank">Preview this book</a>
    `;
}

function watchBackClick() {
    $('.back-to-results').on('click', event => {
        event.preventDefault();
        returnToSearchResults();
    })
}

function displayBookDetail(bookId) {
    let book = null;
    for (let i = 0; i < bookResultsArray.length; i++) {
        if (bookResultsArray[i].id === bookId) {
            book = bookResultsArray[i];
            isbn = book.volumeInfo.industryIdentifiers[0].identifier;
            break;
        }
    }
    const bookDetailCard = generateBookDetail(book);
    const bookReviewCard = getReviewData(isbn);
    $('#js-search-results-total').prop('hidden', true);
    $('#js-search-results-list').parent().prop('hidden', true);
    $('#js-result-content').prop('hidden', false).html(`${bookDetailCard}${bookReviewCard}`);
    watchBackClick();
}

// function displayWikiDetail() {

// }

function getReviewData(isbn) {
    const params = {
        callback: '?',
        format: 'json',
        key: 'OndROFmtllOOQVVFp3Z91g',
        user_id: '89700235',
    }
    const queryString = formatQueryParams(params);
    const url = `${goodReadsUrl}${isbn}?${queryString}`;
    $.getJSON(url).done((data) => {
        alert(data);
    })

    // fetch(url)
    // .then(response => response.json())
    // .then(responseJson => displayReviewsDetail(responseJson))
}

function displayReviewsDetail(responseJson) {
    $('#js-result-content').append(responseJson[reviews_widget]);
}

function watchResultClick() {
    $('.result-title').on('click', event => {
        event.preventDefault();
        displayBookDetail(event.target.dataset.bookId);
    })
}

function getResultsData(query) {
    const params = {
        q: query
    }
    const queryString = formatQueryParams(params);
    const url = `${googleBooksUrl}?${queryString}`;
    fetch(url)
    .then(response => response.json())
    .then(responseJson => {
        bookResultsArray = responseJson.items;
        displayResults(responseJson);
        watchResultClick();
    })
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