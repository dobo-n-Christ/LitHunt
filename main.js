'use strict';

const googleBooksUrl = 'https://www.googleapis.com/books/v1/volumes';
const wikiUrl = 'https://en.wikipedia.org/w/api.php';
const youTubeUrl = 'https://www.googleapis.com/youtube/v3/search';
const tasteDiveUrl = 'https://tastedive.com/api/similar';
let bookResultsArray = [];

function generateWikiExtract(bookExtract, pageId) {
    return `
    <p>${bookExtract.query.pages[pageId].extract}</p>
    <a href="https://en.wikipedia.org/?curid=${pageId}" target="_blank">Full Wikipedia page</a>
    `;
}

function displayWikiExtract(bookExtract, id) {
    const wikiExtractCard = generateWikiExtract(bookExtract, id);
    $('#js-result-content').append(wikiExtractCard);
}

function getWikiData(id) {
    const params = {
        action: 'query',
        format: 'json',
        prop: 'extracts',
        exintro: '',
        explaintext: '',
        pageids: id,
        origin: '*'
    }
    const queryString = formatQueryParams(params);
    const url = `${wikiUrl}?${queryString}`;
    fetch(url)
    .then(response => response.json())
    .then(responseJson => displayWikiExtract(responseJson, id));
}

function getPageId(book) {
    const params = {
        action: 'query',
        format: 'json',
        list: 'search',
        srlimit: 1,
        srsearch: book,
        origin: '*'
    }
    const queryString = formatQueryParams(params);
    const url = `${wikiUrl}?${queryString}`;
    fetch(url)
    .then(response => response.json())
    .then(responseJson => {
        const pageId = responseJson.query.search[0].pageid;
        getWikiData(pageId);
    })
}

function generateVideoElement(video) {
    return `
    <h3>${video.snippet.title}</h3>
    <a href="https://www.youtube.com/watch?v=${video.id.videoId}" target="_blank"><img src="${video.snippet.thumbnails.medium.url}" alt="Click this thumbnail to navigate to this video, which is entitled ${video.snippet.title}"></a>
    `;
}

function displayYouTubeResults(videoResults) {
    const videoResultsArray = videoResults.items;
    for (let i = 0; i < videoResultsArray.length; i++) {
        const video = videoResultsArray[i];
        const videoElement = generateVideoElement(video);
        $('#js-result-content').append(videoElement);
    }
}

function generateYouTubeLink(bookTitle) {
    const bookSearchTerm = encodeURIComponent(bookTitle).replace(/%20/g, '+').replace(/'/g, '%27');
    return `
    <a href="https://www.youtube.com/results?search_query=${bookSearchTerm}" target="_blank">More YouTube results</a>
    `;
}

function displayYouTubeLink(bookTitle) {
    const youTubeLink = generateYouTubeLink(bookTitle);
    $('#js-result-content').append(youTubeLink);
}

function getYouTubeData(book) {
    const params = {
        part: 'snippet',
        q: `${book} read`,
        maxResults: 3,
        type: 'video',
        key: 'AIzaSyCspee-SMBxqnWcQJa3h6wgZKMIBkVooz0'
    }
    const queryString = formatQueryParams(params);
    const url = `${youTubeUrl}?${queryString}`;
    fetch(url)
    .then(response => response.json())
    .then(responseJson => {
        displayYouTubeResults(responseJson);
        displayYouTubeLink(params.q);
    });
}

function generateSearchIntro(book) {
    return `
    <h4>If you enjoy reading ${book.Info[0].Name},</h4>
    <h4>TasteDive has the following recommendations for you:</h4>
    `;
}

function generateRecElement(rec) {
    return `
    <a href="${rec.wUrl}" target="_blank">${rec.Name} (${rec.Type})</a>
    `;
}

function displayTasteDiveResults(data, title) {
    const tasteDataset = data.Similar;
    const tasteRecs = tasteDataset.Results;
    if (Array.isArray(tasteRecs) && tasteRecs.length) {
        const tasteSearchIntro = generateSearchIntro(tasteDataset);
        $('#js-result-content').append(tasteSearchIntro);
        for (let i = 0; i < tasteRecs.length; i++) {
            const tasteRec = tasteRecs[i];
            const recElement = generateRecElement(tasteRec);
            $('#js-result-content').append(recElement);
        }
        displayTasteDiveLink(title);
    }
}

function generateTasteDiveLink(title) {
    const bookSearchTerm = encodeURIComponent(title).replace(/%20/g, '+').replace(/'/g, '%27');
    return `
    <a href="https://tastedive.com/like/book:${bookSearchTerm}" target="_blank">More TasteDive recommendations</a>
    `;
}

function displayTasteDiveLink(bookTitle) {
    const tasteDiveLink = generateTasteDiveLink(bookTitle);
    $('#js-result-content').append(tasteDiveLink);
}

function getTasteDiveData(book) {
    const params = {
        callback: '?',
        q: `book:${book}`,
        limit: 10,
        info: 1,
        k: '324145-Literatu-VZEN2AQI'
    }
    const queryString = formatQueryParams(params).replace(/%3F/g, '?');
    $.getJSON(tasteDiveUrl, queryString, responseJson => displayTasteDiveResults(responseJson, book));
}





function formatQueryParams(params) {
    const queryParamItems = Object.keys(params).map(key => 
        `${encodeURIComponent(key)}=${encodeURIComponent(params[key]).replace(/%20/g, '+').replace(/'/g, '%27')}`);
    return queryParamItems.join('&');
}

function displayResultsTotal(responseJson) {
    $('#js-search-results-total').prop('hidden', false).html(`${responseJson.totalItems} results`);
}

function generateThumbnailElement(thumbnail) {
    return `
    <img src="${thumbnail}" alt="Image of front cover of book">
    `;
}

function handleThumbnail(item) {
    const imageData = item.volumeInfo.imageLinks;
    if (imageData) {
        const thumbnail = imageData.smallThumbnail;
        const thumbnailElement = generateThumbnailElement(thumbnail);
        return thumbnailElement;
    }
    else {
        const thumbnail = "https://books.google.de/googlebooks/images/no_cover_thumb.gif";
        const thumbnailElement = generateThumbnailElement(thumbnail);
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
                    <a href="#" data-book-id="${item.id}" class="js-result-title">${item.volumeInfo.title}</a>
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

function handleIsbn(book) {
    const identArray = book.volumeInfo.industryIdentifiers;
    if (identArray) {
        if (identArray.length > 1) {
            if (identArray[0].type.endsWith('10')) {
                return `
                <ul>
                    <li>ISBN-10: ${identArray[0].identifier}</li>
                    <li>ISBN-13: ${identArray[1].identifier}</li>
                </ul>
                `;
            }
            return `
            <ul>
                <li>ISBN-10: ${identArray[1].identifier}</li>
                <li>ISBN-13: ${identArray[0].identifier}</li>
            </ul>
            `;
        }
        else if (identArray[0].type.startsWith('ISBN')) {
            return `
            <ul>
                <li>ISBN: ${identArray[0].identifier}</li>
            </ul>
            `;
        }
        return '';
    }
    return '';
}

function handleDetailSummary(item) {
    if (item.volumeInfo.description) {
        return `
        <p class="result-summary">${item.volumeInfo.description}</p>
        `;
    }
    else if (item.searchInfo) {
        return `
        <p class="result-summary">${item.searchInfo.textSnippet}</p>
        `;
    }
    else {
        return '';
    }
}

function generateBookDetail(book) {
    return `
    <a href="#" class="back-to-results">Back to Search Results</a>
    <h3>${book.volumeInfo.title}</h3>
    <a href="${book.volumeInfo.infoLink}" target="_blank">${handleThumbnail(book)}</a>
    <h4>${handleAuthor(book)}</h4>
    <p>${handlePublisher(book)} ${handleDatePublished(book)}</p>
    ${handleIsbn(book)}
    ${handleDetailSummary(book)}
    <a href="${book.volumeInfo.previewLink}" target="_blank">Preview this book</a>
    `;
}

function returnToSearchResults() {
    $('#js-search-results-total').prop('hidden', false);
    $('#js-search-results-list').parent().prop('hidden', false);
    $('#js-result-content').empty().prop('hidden', true);
}

function watchBackClick() {
    $('.back-to-results').on('click', event => {
        event.preventDefault();
        returnToSearchResults();
    })
}

function displayBookDetail(bookId) {
    let book;
    for (let i = 0; i < bookResultsArray.length; i++) {
        if (bookResultsArray[i].id === bookId) {
            book = bookResultsArray[i];
            break;
        }
    }
    const bookDetailCard = generateBookDetail(book);
    $('#js-search-results-total').prop('hidden', true);
    $('#js-search-results-list').parent().prop('hidden', true);
    $('#js-result-content').prop('hidden', false).html(`${bookDetailCard}`);
    watchBackClick();
}

function generateAmazonLink(book) {
    const bookSearchTerm = encodeURIComponent(book);
    return `
    <a href="https://www.amazon.com/s?url=search-alias%3Daps&field-keywords=${bookSearchTerm}" target="_blank">
    <img src="http://g-ec2.images-amazon.com/images/G/01/social/api-share/amazon_logo_500500._V323939215_.png" alt="Amazon.com logo with the word 'amazon' in lowercase black letters and an orange arrow underneath curving from the first letter 'a' to the letter 'z'">
    This and related products at Amazon.com</a>
    `;
}

function displayAmazonLink(book) {
    const amazonLink = generateAmazonLink(book);
    $('#js-result-content').append(amazonLink);
}

function watchResultClick() {
    $('a.js-result-title').on('click', event => {
        event.preventDefault();
        console.log("it worked!");
        const bookTitle = event.target.innerText.trim();
        displayBookDetail(event.target.dataset.bookId);
        getPageId(bookTitle);
        getYouTubeData(bookTitle);
        displayAmazonLink(bookTitle);
        getTasteDiveData(bookTitle);
    })
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
        $('#js-result-content').empty().prop('hidden', true);
        const searchTerm = $('#js-search-term').val();
        getResultsData(searchTerm);
    })
}

$(watchForm);