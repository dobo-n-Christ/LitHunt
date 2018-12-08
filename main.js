'use strict';

const googleBooksUrl = 'https://www.googleapis.com/books/v1/volumes';
const wikiUrl = 'https://en.wikipedia.org/w/api.php';
const youTubeUrl = 'https://www.googleapis.com/youtube/v3/search';
const tasteDiveUrl = 'https://tastedive.com/api/similar';
let bookResultsArray = [];

function formatQueryParams(params) {
    const queryParamItems = Object.keys(params).map(key => 
        `${encodeURIComponent(key)}=${encodeURIComponent(params[key]).replace(/%20/g, '+').replace(/'/g, '%27')}`);
    return queryParamItems.join('&');
}

function displayResultsTotal(responseJson) {
    $('#js-search-results-total').html(`Your LitHunt returned ${responseJson.totalItems} results:`);
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
    hideGrandparent('#js-error-message');
    $('#js-search-results-list').empty();
    displayResultsTotal(responseJson);
    for (let i = 0; i < responseJson.items.length; i++) {
        const resultElement = generateResultElement(responseJson, i);
		$('#js-search-results-list').append(resultElement);
    }
    unhideGreatGrandparent('#js-search-results-list');
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
    <h3>${book.volumeInfo.title}</h3>
    <a href="${book.volumeInfo.infoLink}" target="_blank">${handleThumbnail(book)}</a>
    <h4>${handleAuthor(book)}</h4>
    <p>${handlePublisher(book)} ${handleDatePublished(book)}</p>
    ${handleIsbn(book)}
    ${handleDetailSummary(book)}
    <a href="${book.volumeInfo.previewLink}" target="_blank">Preview this book</a>
    `;
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
    hideGrandparent('#js-search-results-total');
    $('#js-book-detail-card').html(bookDetailCard);
    unhideGrandparent('#js-book-detail-card');
}

function generateWikiExtract(bookExtract, pageId) {
    return `
    <p>${bookExtract.query.pages[pageId].extract}</p>
    <a href="https://en.wikipedia.org/?curid=${pageId}" target="_blank">Full Wikipedia page</a>
    `;
}

function displayWikiExtract(bookExtract, id) {
    const wikiExtractCard = generateWikiExtract(bookExtract, id);
    $('#js-wiki-card').html(wikiExtractCard);
    unhideGrandparent('#js-wiki-card');
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

function generateYouTubeLink(bookTitle) {
    const bookSearchTerm = encodeURIComponent(bookTitle).replace(/%20/g, '+').replace(/'/g, '%27');
    return `
    <a href="https://www.youtube.com/results?search_query=${bookSearchTerm}" target="_blank">More YouTube results</a>
    `;
}

function displayYouTubeLink(bookTitle) {
    const youTubeLink = generateYouTubeLink(bookTitle);
    $('#js-youtube-card').append(youTubeLink);
    unhideGrandparent('#js-youtube-card');
}

function displayYouTubeResults(videoResults, bookTerm) {
    const videoResultsArray = videoResults.items;
    if (videoResultsArray.length > 0) {
        for (let i = 0; i < videoResultsArray.length; i++) {
            const video = videoResultsArray[i];
            const videoElement = generateVideoElement(video);
            $('#js-youtube-card').append(videoElement);
        }
        displayYouTubeLink(bookTerm);
    }
}

function getYouTubeData(book) {
    const params = {
        part: 'snippet',
        q: `${book} read|book|novel|poem`,
        maxResults: 4,
        type: 'video',
        key: 'AIzaSyCspee-SMBxqnWcQJa3h6wgZKMIBkVooz0'
    }
    const queryString = formatQueryParams(params);
    const url = `${youTubeUrl}?${queryString}`;
    fetch(url)
    .then(response => response.json())
    .then(responseJson => {
        displayYouTubeResults(responseJson, params.q);
    });
}

function generateAmazonLink(book) {
    const bookSearchTerm = encodeURIComponent(book);
    return `
    https://www.amazon.com/s?url=search-alias%3Daps&field-keywords=${bookSearchTerm}
    `;
}

function generateAmazonElement(book) {
    const amazonLink = generateAmazonLink(book);
    return `
    <a href="${amazonLink}" class="amazon-link" target="_blank">
    <img src="Images/amazon.png" class="amazon-logo" alt="Amazon.com logo with the word 'amazon' in lowercase black letters and an orange arrow underneath curving from the first letter 'a' to the letter 'z'">
    This and related products at Amazon.com</a>
    `;
}

function displayAmazonLink(book) {
    const amazonElement = generateAmazonElement(book);
    $('#js-amazon-card').html(amazonElement);
    unhideGrandparent('#js-amazon-card');
}

function generateSearchIntro(book) {
    return `
    <h4>If you enjoy reading ${book.Info[0].Name},</h4>
    <h4>TasteDive has the following recommendations for you:</h4>
    `;
}

function generateRecElement(rec) {
    return `
    <a href="${generateAmazonLink(rec.Name)}" target="_blank">${rec.Name} (${rec.Type})</a>
    `;
}
// ${rec.wUrl}

function generateTasteDiveLink(title) {
    const bookSearchTerm = encodeURIComponent(title).replace(/%20/g, '+').replace(/'/g, '%27');
    return `
    <a href="https://tastedive.com/like/book:${bookSearchTerm}" target="_blank">More TasteDive recommendations</a>
    `;
}

function displayTasteDiveLink(bookTitle) {
    const tasteDiveLink = generateTasteDiveLink(bookTitle);
    $('#js-tastedive-card').append(tasteDiveLink).prop('hidden', false);
}

function displayTasteDiveResults(data, title) {
    const tasteDataset = data.Similar;
    const tasteRecs = tasteDataset.Results;
    if (Array.isArray(tasteRecs) && tasteRecs.length) {
        const tasteSearchIntro = generateSearchIntro(tasteDataset);
        $('#js-tastedive-card').html(tasteSearchIntro);
        for (let i = 0; i < tasteRecs.length; i++) {
            const tasteRec = tasteRecs[i];
            const recElement = generateRecElement(tasteRec);
            $('#js-tastedive-card').append(recElement);
        }
        displayTasteDiveLink(title);
    }
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
    $.getJSON(tasteDiveUrl, queryString, responseJson => {
        displayTasteDiveResults(responseJson, book)
    });
}

function returnToSearchResults() {
    $('html, body').scrollTop($('main').offset().top);
    // window.scrollTo(0, 0);
    unhideGrandparent('#js-search-results-total');
    hideCards();
    emptyCards();
}

function watchBackClick() {
    $('.back-button').on('click', event => {
        event.preventDefault();
        returnToSearchResults();
    })
}

function watchResultClick() {
    $('a.js-result-title').on('click', event => {
        $('html, body').scrollTop($('main').offset().top);
        // $('body').animate({ scrollTop: 410}, 800);
        event.preventDefault();
 
        $('#js-back-button').prop('hidden', false);
        // window.scrollTo(0, 410);
        const bookTitle = event.target.innerText.trim();
        displayBookDetail(event.target.dataset.bookId);
        getPageId(bookTitle);
        getYouTubeData(bookTitle);
        displayAmazonLink(bookTitle);
        getTasteDiveData(bookTitle);
        watchBackClick();
    })
}

function handleError(err) {
    hideGrandparent('#js-search-results-total');
    hideGrandparent('#js-top-button');
    $('#js-search-results-total').empty();
    $('#js-search-results-list').empty();
    $('#js-error-message').text(`Something went wrong: ${err.message}`);
    unhideGrandparent('#js-error-message');
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
        hideGrandparent('header');
        hideGrandparent('#js-search-form');
        // $('html, body').animate({
        //     scrollTop: $('main').offset().top
        // }, 800);
        // $('body').animate({ scrollTop: 410 }, 800);
        bookResultsArray = responseJson.items;
        displayResults(responseJson);
        watchResultClick();
        unhideGrandparent('#js-top-button');
    })
    .catch(handleError);
}

function hideGreatGrandparent(id) {
    $(id).parent().parent().parent().prop('hidden', true);
}

function unhideGreatGrandparent(id) {
    $(id).parent().parent().parent().prop('hidden', false);
}

function hideGrandparent(id) {
    $(id).parent().parent().prop('hidden', true);
}

function unhideGrandparent(id) {
    $(id).parent().parent().prop('hidden', false);
}

function hideParent(id) {
    $(id).parent().prop('hidden', true);
}

function unhideParent(id) {
    $(id).parent().prop('hidden', false);
}

function hideCards() {
    $('#js-back-button').prop('hidden', true);
    hideGrandparent('#js-book-detail-card');
    hideGrandparent('#js-wiki-card');
    hideGrandparent('#js-youtube-card');
    hideGrandparent('#js-amazon-card');
}

function emptyCards() {
    $('#js-youtube-card, #js-amazon-card, #js-tastedive-card').empty();
}

function watchForm() {
    $('#js-search-form').submit(event => {
        event.preventDefault();
        const searchTerm = $('#js-search-term').val();
        getResultsData(searchTerm);
        hideCards();
        emptyCards();
    })
}

$(watchForm);