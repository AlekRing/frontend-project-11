import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import i18next from 'i18next';
import { string } from 'yup';
import axios from 'axios';
import resources from './locales/index';
import {
  getLink,
  hashString,
  isAlreadyExists,
  validateUrl,
} from './utilities';
import renderContent, { renderFormFeedback } from './renderContent';

const fetchRSS = (url) => axios.get(getLink(url)).then(((response) => response));

const parseContent = (rawData) => {
  if (!rawData?.data?.contents) throw new Error('unknown');

  const parser = new DOMParser();
  const dom = parser.parseFromString(rawData.data.contents, 'text/xml');
  const parseError = dom.querySelector('parsererror');

  if (parseError) throw new Error('noRss');

  const channelTitle = dom.querySelector('channel > title')?.textContent;
  const channelDescription = dom.querySelector('channel > description')?.textContent;
  const itemElements = dom.querySelectorAll('item');

  const posts = [...itemElements].map((val) => {
    const title = val.querySelector('title')?.textContent;
    const itemLink = val.querySelector('link')?.textContent;
    const description = val.querySelector('description')?.textContent;

    return {
      id: hashString(title),
      title,
      link: itemLink,
      description,
    };
  });

  return { feed: { title: channelTitle, description: channelDescription }, posts };
};

const updateState = ({ rssStreams, formFeedback, links }, { feed, posts }, url, hash) => {
  if (!feed || !posts) throw new Error('unknown');

  const stateFeeds = rssStreams.feeds;
  const statePosts = rssStreams.posts;

  const stateFeed = stateFeeds.find((f) => f.id === hash);

  if (!stateFeed) {
    formFeedback.success = 'success';
    stateFeeds.push({ ...feed, url, id: hash });
  }

  posts.forEach((post) => {
    if (!statePosts.find((p) => p.id === post.id)) statePosts.push(post);
  });

  links.push(url);
};

const updateFeeds = (state, i18nextInstance, handleError, domEls) => {
  const { feeds } = state.rssStreams;
  const feedsIds = [];
  const promises = feeds.map((feed) => {
    feedsIds.push(feed.id);
    return fetchRSS(feed.url).then(parseContent);
  });

  Promise.all(promises)
    .then((values) => values.forEach((val, ind) => {
      updateState(state, val, val.url, feedsIds[ind]);
      renderContent(state, domEls, i18nextInstance);
    }))
    .then(() => setTimeout(updateFeeds, state.timeout, state, i18nextInstance, handleError, domEls))
    .catch(handleError);
};

const getDOMEls = () => {
  const domElements = {};

  domElements.modal = document.getElementById('modal');
  domElements.modalTitle = domElements.modal.querySelector('.modal-title');
  domElements.modalText = domElements.modal.querySelector('.text-break');
  domElements.modalButton = domElements.modal.querySelector('.btn-primary');
  domElements.closeBtn = domElements.modal.querySelector('.btn-secondary');
  domElements.closeBtnSecond = domElements.modal.querySelector('.btn-close');
  domElements.form = document.querySelector('.rss-form');
  domElements.input = domElements.form.querySelector('#url-input');

  return domElements;
};

const App = (state) => {
  const urlValidationScheme = string().url().required();
  const domEls = getDOMEls();
  const i18nextInstance = i18next.createInstance();

  i18nextInstance.init({
    lng: 'ru',
    debug: false,
    resources,
  }).then(() => {
    domEls.form.addEventListener('submit', (e) => {
      e.preventDefault();

      state.formFeedback = {
        isSubmited: true,
        success: '',
        error: '',
      };

      const url = new FormData(e.target)?.get('url');
      const hash = hashString(url);

      const handleError = (error) => {
        console.error(error);

        state.formFeedback.error = error.message;
        renderFormFeedback(state.formFeedback, i18nextInstance, domEls);
      };

      if (isAlreadyExists(hash, state.rssStreams.feeds)) return handleError(new Error('exists'));

      return validateUrl(url, urlValidationScheme)
        .then(fetchRSS)
        .then((fetched) => {
          const parsed = parseContent(fetched);

          updateState(state, parsed, url, hash);
          renderContent(state, domEls, i18nextInstance);

          setTimeout(() => updateFeeds(state, i18nextInstance, handleError, domEls), state.timeout);
        })
        .catch(handleError);
    });
  });
};

export default App;
