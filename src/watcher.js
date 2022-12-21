import onChange from 'on-change';
import { renderFeeds, renderPosts, rendeFormFeedback, renderModal } from './renderContent';

const watchState = (state, domEls, i18next) => {
  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'rssStreams.posts':
        renderPosts(state.rssStreams, i18next);
        break;
      case 'rssStreams.feeds':
        renderFeeds(value, i18next);
        break;
      case 'appStatus':
        rendeFormFeedback(state, domEls, i18next);
        break;
      case 'modal.postId':
        renderModal(state, value, domEls);
        break;
      default:
        break;
    }
  });

  return watchedState;
};

export default watchState;
