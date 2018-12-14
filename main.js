'use strict';

const googleBooksUrl = 'https://www.googleapis.com/books/v1/volumes';
const wikiUrl = 'https://en.wikipedia.org/w/api.php';
const youTubeUrl = 'https://www.googleapis.com/youtube/v3/search';
const tasteDiveUrl = 'https://tastedive.com/api/similar';
let bookResultsArray = [];
let resultsPageNumber = 1;
const googleBooksParams = {
    q: '',
    startIndex: 0
}

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
    <img src="${thumbnail}" class="detail-thumbnail" alt="Image of front cover of book">
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
            <a href="#" data-book-id="${item.id}" data-book-title="${item.volumeInfo.title}" class="js-result-title result-title">
                <article>
                    <h3 class="result-title">
                        ${item.volumeInfo.title}
                    </h3>
                    ${thumbnail}
                    <div class="result-info">
                        ${pubData}
                    </div>
                    ${summary}
                </article>
            </a>
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
    $('html, body').scrollTop($('main').offset().top);
    if (googleBooksParams.startIndex === 0) {
        displayResultsTotal(responseJson);
    }
    if (!bookResultsArray || bookResultsArray.length !== 10) {
        $('#js-next-button').prop('hidden', true);
    }
    unhideGrandparent('#js-next-button');
    for (let i = 0; i < responseJson.items.length; i++) {
        const resultElement = generateResultElement(responseJson, i);
        $('#js-search-results-list').append(resultElement);
        unhideGreatGrandparent('#js-search-results-list');
    }
}

function handleIsbn(book) {
    const identArray = book.volumeInfo.industryIdentifiers;
    if (identArray) {
        if (identArray.length > 1) {
            if (identArray[0].type.endsWith('10')) {
                return `
                <ul class="isbn">
                    <li>ISBN-10: ${identArray[0].identifier}</li>
                    <li>ISBN-13: ${identArray[1].identifier}</li>
                </ul>
                `;
            }
            return `
            <ul class="isbn">
                <li>ISBN-10: ${identArray[1].identifier}</li>
                <li>ISBN-13: ${identArray[0].identifier}</li>
            </ul>
            `;
        }
        else if (identArray[0].type.startsWith('ISBN')) {
            return `
            <ul class="isbn">
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
        <p class="detail-summary">${item.volumeInfo.description}</p>
        `;
    }
    else if (item.searchInfo) {
        return `
        <p class="detail-summary">${item.searchInfo.textSnippet}</p>
        `;
    }
    else {
        return '';
    }
}

function generateBookDetail(book) {
    return `
    <h2>From Google Books</h2>
    <h3>${book.volumeInfo.title}</h3>
    <a href="${book.volumeInfo.infoLink}" target="_blank">${handleThumbnail(book)}</a>
    <h4>${handleAuthor(book)}</h4>
    <p class="pub-data">${handlePublisher(book)} ${handleDatePublished(book)}</p>
    ${handleIsbn(book)}
    ${handleDetailSummary(book)}
    <div class="detail-links">
        <a href="${book.volumeInfo.previewLink}" class="preview-link" target="_blank">
            Preview This Book
            <img src="Images/icons8-external-link-30.png" class="open-new-page-symbol" alt="External link symbol consisting of a square with rounded corners and a diagonal arrow pointing from the center of the square through the upper right corner">
        </a>
        <a href="${book.volumeInfo.infoLink}" class="read-link" target="_blank">
            Read More
            <img src="Images/icons8-external-link-30.png" class="open-new-page-symbol" alt="External link symbol consisting of a square with rounded corners and a diagonal arrow pointing from the center of the square through the upper right corner">
        </a>
    </div>
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
    <h2>From Wikipedia</h2>
    <article>${bookExtract.query.pages[pageId].extract}</article>
    <a href="https://en.wikipedia.org/?curid=${pageId}" class="wiki-link" target="_blank">
        Read More
        <img src="Images/icons8-external-link-30.png" class="open-new-page-symbol" alt="External link symbol consisting of a square with rounded corners and a diagonal arrow pointing from the center of the square through the upper right corner">
    </a>
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
        srlimit: 4,
        srsearch: book,
        origin: '*'
    }
    const queryString = formatQueryParams(params);
    const url = `${wikiUrl}?${queryString}`;
    fetch(url)
    .then(response => response.json())
    .then(responseJson => {
        for (let i = 0; i < params.srlimit; i++) {
            const pageTitle = responseJson.query.search[i].title;
            if (!pageTitle.includes('(film)')) {
                const pageId = responseJson.query.search[i].pageid;
                getWikiData(pageId);
                break;
            }
        }
    })
}

function generateYouTubeHeading() {
    return `From YouTube`;
}

function displayYouTubeHeading() {
    const youTubeHeading = generateYouTubeHeading();
    $('#js-youtube-card-heading').html(youTubeHeading);
}

function generateVideoElement(video) {
    return `
    <li>
    <a href="https://www.youtube.com/watch?v=${video.id.videoId}" target="_blank">
        <img src="${video.snippet.thumbnails.medium.url}" alt="Click this thumbnail to navigate to this video, which is entitled ${video.snippet.title}">
        <h3 class="youtube-title">${video.snippet.title}</h3>
    </a>
    </li>
    `;
}

function generateYouTubeLink(bookTitle) {
    const bookSearchTerm = encodeURIComponent(bookTitle).replace(/%20/g, '+').replace(/'/g, '%27');
    return `
    <a href="https://www.youtube.com/results?search_query=${bookSearchTerm}" class="youtube-link" target="_blank">
        See More
        <img src="Images/icons8-external-link-30.png" class="open-new-page-symbol" alt="External link symbol consisting of a square with rounded corners and a diagonal arrow pointing from the center of the square through the upper right corner">
    </a>
    `;
}

function displayYouTubeLink(bookTitle) {
    const youTubeLink = generateYouTubeLink(bookTitle);
    $('#js-youtube-card-link').html(youTubeLink);
    unhideParent('#js-youtube-card-link');
}

function displayYouTubeResults(videoResults, bookTerm) {
    const videoResultsArray = videoResults.items;
    if (videoResultsArray.length > 0) {
        displayYouTubeHeading();
        for (let i = 0; i < videoResultsArray.length; i++) {
            const video = videoResultsArray[i];
            const videoElement = generateVideoElement(video);
            $('#js-youtube-card-list').append(videoElement);
        }
        displayYouTubeLink(bookTerm);
    }
}

function getYouTubeData(book) {
    const params = {
        part: 'snippet',
        q: `${book} read|book|novel|poem`,
        maxResults: 5,
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
    <h2>From Amazon</h2>
    <a href="${amazonLink}" class="amazon-link" target="_blank">
        <img src="Images/amazon.png" class="amazon-logo" alt="Amazon.com logo with the word 'amazon' in lowercase black letters and an orange arrow underneath curving from the first letter 'a' to the letter 'z'">
        See This Book and More
        <img src="Images/icons8-external-link-30.png" class="open-new-page-symbol" alt="External link symbol consisting of a square with rounded corners and a diagonal arrow pointing from the center of the square through the upper right corner">
    </a>
    `;
}

function displayAmazonLink(book) {
    const amazonElement = generateAmazonElement(book);
    $('#js-amazon-card').html(amazonElement);
    unhideGrandparent('#js-amazon-card');
}

function generateTasteDiveHeading() {
    return `From TasteDive`;
}

function displayTasteDiveHeading() {
    const tasteDiveHeading = generateTasteDiveHeading();
    $('#js-tastedive-card-heading').html(tasteDiveHeading);
}

function generateTasteDiveIntro(book) {
    return `
    <span class="sub-clause">If you are enjoying</span>
    <span class="book-title">${book.Info[0].Name},</span>
    <span class="main-clause">we recommend the following:</span>
    `;
}

function displayTasteDiveIntro(tasteDataset) {
    const tasteSearchIntro = generateTasteDiveIntro(tasteDataset);
    $('#js-tastedive-card-intro').html(tasteSearchIntro);
}

function generateRecElement(rec) {
    return `
    <li class="tastedive-list-item">
        <a href="${generateAmazonLink(rec.Name)}" target="_blank">
            <img src="Images/icons8-external-link-30.png" class="open-new-page-symbol" alt="External link symbol consisting of a square with rounded corners and a diagonal arrow pointing from the center of the square through the upper right corner">
            ${rec.Name} (${rec.Type})
        </a>
    </li>
    `;
}

function generateTasteDiveLink(title) {
    const bookSearchTerm = title.trim().replace(/[^a-z0-9]+/gi, "-");
    return `
    <a href="https://tastedive.com/like/${bookSearchTerm}-Book" class="tastedive-link" target="_blank">
        Get More
        <img src="Images/icons8-external-link-30.png" class="open-new-page-symbol" alt="External link symbol consisting of a square with rounded corners and a diagonal arrow pointing from the center of the square through the upper right corner">
    </a>
    `;
}

function displayTasteDiveLink(bookTitle) {
    const tasteDiveLink = generateTasteDiveLink(bookTitle);
    $('#js-tastedive-card-link').html(tasteDiveLink);
}

function displayTasteDiveResults(data) {
    const tasteDataset = data.Similar;
    const tasteRecs = tasteDataset.Results;
    if (Array.isArray(tasteRecs) && tasteRecs.length) {
        displayTasteDiveHeading();
        displayTasteDiveIntro(tasteDataset);
        for (let i = 0; i < tasteRecs.length; i++) {
            const tasteRec = tasteRecs[i];
            const recElement = generateRecElement(tasteRec);
            $('#js-tastedive-card-list').append(recElement);
        }
        displayTasteDiveLink(tasteDataset.Info[0].Name);
        unhideParent('#js-tastedive-card-list');
    }
}

function getTasteDiveData(book) {
    const params = {
        callback: '?',
        q: `book:${book}`,
        limit: 7,
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
    unhideGreatGrandparent('#js-search-results-list');
    if (resultsPageNumber > 1) {
        $('#js-previous-button').prop('hidden', false);
    }
    if (!bookResultsArray || bookResultsArray.length !== 10) {
        $('#js-next-button').prop('hidden', true);
    }
    unhideGrandparent('#js-next-button');
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
    const articleLink = $('a.js-result-title');
    articleLink.on('click', event => {
        $('html, body').scrollTop($('main').offset().top);
        event.preventDefault();
        hideGrandparent('#js-next-button');
        $('#js-back-button').prop('hidden', false);
        let bookTitle;
        let clickedElement = event.target;
        let bookId = clickedElement.dataset.bookId;
        while (!bookId) {
            clickedElement = clickedElement.parentElement;
            bookId = clickedElement.dataset.bookId;
            bookTitle = clickedElement.dataset.bookTitle;
        }
        bookTitle = bookTitle.trim();
        displayBookDetail(bookId);
        getPageId(bookTitle);
        getYouTubeData(bookTitle);
        displayAmazonLink(bookTitle);
        getTasteDiveData(bookTitle);
        watchBackClick();
    })
}

function handleError(err) {
    hideGrandparent('#js-search-results-total');
    hideParent('#js-top-button');
    hideGrandparent('#js-next-button');
    $('#js-search-results-total').empty();
    $('#js-search-results-list').empty();
    $('#js-error-message').text(`Something went wrong: ${err.message}`);
    unhideGrandparent('#js-error-message');
}

function testForSpecificErrors(errorObject, totalItems, responseJson) {
    if (totalItems === 0) {
        throw new Error('Your search input is invalid. Please try another search.');
    }
    else if (errorObject && errorObject.message === "Missing query.") {
        throw new Error('Missing query. Please input a valid search term.');
    }
    else if (errorObject) {
        throw new Error(`${errorObject.message}`);
    }
    else {
        displayResults(responseJson);
        watchResultClick();
        unhideParent('#js-top-button');
    }
}

function getResultsData() {
    const queryString = formatQueryParams(googleBooksParams);
    const url = `${googleBooksUrl}?${queryString}`;
    fetch(url)
    .then(response => response.json())
    .then(responseJson => {
        $('html, body').scrollTop($('main').offset().top);
        $('nav').prop('hidden', false);
        hideGrandparent('header');
        hideGrandparent('#js-search-form');
        bookResultsArray = responseJson.items;
        const errorObject = responseJson.error;
        const totalItems = responseJson.totalItems;
        testForSpecificErrors(errorObject, totalItems, responseJson);
        
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
    hideParent('#js-youtube-card-list');
    hideGrandparent('#js-amazon-card');
    hideParent('#js-tastedive-card-list');
}

function emptyCards() {
    $('#js-book-detail-card, #js-wiki-card, #js-youtube-card-heading, #js-youtube-card-list, #js-youtube-card-link, #js-amazon-card, #js-tastedive-card-intro, #js-tastedive-card-list, #js-tastedive-card-link').empty();
}

function watchNavForm() {
    $('#js-search-form-nav').submit(event => {
        event.preventDefault();
        resultsPageNumber = 1;
        googleBooksParams.startIndex = 0;
        $('#js-previous-button').prop('hidden', true);
        const searchTerm = $('#js-search-term-nav').val();
        googleBooksParams.q = searchTerm;
        getResultsData();
        hideCards();
        emptyCards();
    })
}

function watchPreviousClick() {
    $('#js-previous-button').click(event => {
        event.preventDefault();
        $('html, body').scrollTop($('main').offset().top);
        $('#js-next-button').prop('hidden', false);
        resultsPageNumber = --resultsPageNumber;
        if (resultsPageNumber < 2) {
            $('#js-previous-button').prop('hidden', true);
        }
        const newStartIndex = googleBooksParams.startIndex - 10;
        googleBooksParams.startIndex = newStartIndex;
        displayPageNumber();
        getResultsData();
    })
}

function displayPageNumber() {
    if (resultsPageNumber > 1) {
        $('#js-search-results-total').html(`Page ${resultsPageNumber} of your LitHunt Results:`);
    }
}

function watchNextClick() {
    $('#js-next-button').click(event => {
        event.preventDefault();
        $('html, body').scrollTop($('main').offset().top);
        $('#js-previous-button').prop('hidden', false);
        resultsPageNumber = ++resultsPageNumber;
        const newStartIndex = googleBooksParams.startIndex + 10;
        googleBooksParams.startIndex = newStartIndex;
        displayPageNumber();
        getResultsData();
    })
}

function watchForm() {
    $('#js-search-form').submit(event => {
        event.preventDefault();
        resultsPageNumber = 1;
        googleBooksParams.startIndex = 0;
        const searchTerm = $('#js-search-term').val();
        $('#js-search-term-nav').val(searchTerm);
        googleBooksParams.q = searchTerm;
        getResultsData();
        hideCards();
        emptyCards();
    })
}

function watchLogo() {
    $('.js-website-logo').click(event => {
        event.preventDefault();
        location.reload();
    })
}

function handleApp() {
    watchNavForm();
    watchPreviousClick();
    watchNextClick();
    watchForm();
    watchLogo();
}

$(handleApp);