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
import watchState from './watcher';

const fetchRSS = (url) => axios.get(getLink(url)).then(((response) => response));
const timeout = 5000;

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
    const link = val.querySelector('link')?.textContent;
    const description = val.querySelector('description')?.textContent;

    return { title, link, description };
  });

  return { feed: { title: channelTitle, description: channelDescription }, posts };
};

const updateFeeds = (rssStreams, handleError) => {
  const { feeds, posts } = rssStreams;
  const promises = feeds.map((feed) => fetchRSS(feed.url).then(parseContent));

  Promise.all(promises)
    .then((values) => values.forEach((val) => {
      val.posts.forEach((post) => {
        const newPost = { ...post, id: hashString(post.title) };

        if (!posts.find((p) => p.id === newPost.id)) posts.push(newPost);
      });
    }))
    .then(() => setTimeout(updateFeeds, timeout, rssStreams, handleError))
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
  domElements.postsContainer = document.querySelector('.posts');

  return domElements;
};

const runApp = () => {
  const state = {
    rssStreams: {
      readPosts: new Set(),
      feeds: [],
      posts: [],
    },
    links: [],
    modal: {
      postId: null,
    },
    appStatus: '',
    error: '',
  };

  const urlValidationScheme = string().url().required();
  const domEls = getDOMEls();
  const i18nextInstance = i18next.createInstance();
  const watchedState = watchState(state, domEls, i18nextInstance);

  i18nextInstance.init({
    lng: 'ru',
    debug: false,
    resources,
  }).then(() => {
    domEls.form.addEventListener('submit', (e) => {
      e.preventDefault();

      const url = new FormData(e.target)?.get('url');
      watchedState.appStatus = 'submitting';

      const handleError = (error) => {
        console.error(error);

        watchedState.error = error.message;
        watchedState.appStatus = 'invalid';
      };

      if (isAlreadyExists(url, watchedState.links)) return handleError(new Error('exists'));

      return validateUrl(url, urlValidationScheme)
        .then(fetchRSS)
        .then((fetched) => {
          const parsed = parseContent(fetched);

          const { posts, feeds } = watchedState.rssStreams;

          feeds.push({ ...parsed.feed, url });
          parsed.posts.forEach((post) => {
            const newPost = { ...post, id: hashString(post.title) };

            if (!posts.find((p) => p.id === newPost.id)) posts.push(newPost);
          });
          watchedState.links.push(url);
          watchedState.appStatus = 'success';

          setTimeout(() => updateFeeds(watchedState.rssStreams, handleError), timeout);
        })
        .catch(handleError);
    });

    domEls.postsContainer.addEventListener('click', (e) => {
      e.preventDefault();

      const postId = e.target.getAttribute('data-post-id');
      if (!postId) return;

      watchedState.rssStreams.readPosts.add(postId);
      watchedState.modal.postId = postId;
    });

    const closeModal = (e) => {
      e.preventDefault();

      watchedState.modal.postId = '';
    };

    domEls.closeBtn.addEventListener('click', closeModal);
    domEls.closeBtnSecond.addEventListener('click', closeModal);
  });
};

export default runApp;
