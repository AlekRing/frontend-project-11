export const renderFeeds = (feeds, i18next) => {
  const feedsBox = document.querySelector('.feeds');
  const fragmentStructure = document.createElement('div');
  fragmentStructure.classList.add('card', 'border-0');
  fragmentStructure.innerHTML = '<div class=\'card-body\'></div>';

  const feedsTitle = document.createElement('h2');
  feedsTitle.classList.add('card-title', 'h4');
  feedsTitle.textContent = i18next.t('feeds');
  fragmentStructure.querySelector('.card-body').appendChild(feedsTitle);

  const feedsList = document.createElement('ul');
  feedsList.classList.add('list-group', 'border-0', 'rounded-0');

  const feedsListItems = feeds.map((feed) => {
    const title = document.createElement('h3');
    const element = document.createElement('li');
    const description = document.createElement('p');

    element.classList.add('list-group-item', 'border-0', 'border-end-0');
    title.classList.add('h6', 'm-0');
    title.textContent = feed.title;
    description.classList.add('m-0', 'small', 'text-black-50');
    description.textContent = feed.description;
    element.append(title, description);

    return element;
  });

  feedsList.append(...feedsListItems);
  fragmentStructure.appendChild(feedsList);
  feedsBox.innerHTML = '';
  feedsBox.appendChild(fragmentStructure);
};

export const renderPosts = ({ posts, readPosts }, i18next) => {
  const listBox = document.querySelector('.posts');
  const fragmentStructure = document.createElement('div');
  fragmentStructure.classList.add('card', 'border-0');
  fragmentStructure.innerHTML = '<div class=\'card-body\'></div>';

  const list = document.createElement('ul');
  list.classList.add('list-group', 'border-0', 'rounded-0');

  const feedsTitle1 = document.createElement('h2');
  feedsTitle1.classList.add('card-title', 'h4');
  feedsTitle1.textContent = i18next.t('posts');
  fragmentStructure.querySelector('.card-body').appendChild(feedsTitle1);

  const postsItems = posts.map((post) => {
    const postItem = document.createElement('li');
    postItem.className = 'list-group-item d-flex justify-content-between align-items-start border-0 border-end-0';

    const link = document.createElement('a');
    if (!readPosts.has(post.id)) link.classList.add('fw-bold');
    link.href = post.link;
    link.textContent = post.title;
    link.id = post.id;

    const btn = document.createElement('button');
    btn.className = 'btn btn-outline-primary btn-sm';
    btn.textContent = i18next.t('preview');
    btn.setAttribute('data-post-id', post.id);

    postItem.append(link);
    postItem.append(btn);

    return postItem;
  });

  list.append(...postsItems);
  fragmentStructure.appendChild(list);
  listBox.innerHTML = '';
  listBox.appendChild(fragmentStructure);
};

export const rendeFormFeedback = ({ error, appStatus }, { form, input }, i18next) => {
  const feedBack = document.querySelector('.feedback');

  form.reset();
  input.focus();

  if (appStatus === 'submitting') return;

  if (appStatus === 'invalid') {
    input.classList.add('is-invalid');
    feedBack.textContent = i18next.t(`errors.${error}`);
    feedBack.classList.remove('text-success');
    feedBack.classList.add('text-danger');
    return;
  }

  if (appStatus === 'success') {
    input.classList.remove('is-invalid');
    feedBack.textContent = i18next.t('success');
    feedBack.classList.remove('text-danger');
    feedBack.classList.add('text-success');
  }
};

export const renderModal = (state, id, domEls) => {
  const {
    modalTitle, modalText, modalButton, modal,
  } = domEls;

  if (!id) {
    modal.style = 'display: none;';
    modal.classList.remove('show');
    return;
  }

  const link = document.getElementById(id);
  const post = state.rssStreams.posts.find((p) => p.id === Number(id));

  link.classList.remove('fw-bold');
  link.classList.add('fw-normal');

  modalTitle.textContent = post.title;
  modalText.textContent = post.description;
  modalButton.href = post.link;
  modal.style = 'display: block;';
  modal.classList.add('show');
};
