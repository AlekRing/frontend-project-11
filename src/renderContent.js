const renderFeeds = (allStreams, i18nextInstance) => {
	const feedsBox = document.querySelector('.feeds');
	const fragmentStructure = document.createElement('div');
	fragmentStructure.classList.add('card', 'border-0');
	fragmentStructure.innerHTML = '<div class=\'card-body\'></div>';

	const feedsTitle = document.createElement('h2');
	feedsTitle.classList.add('card-title', 'h4');
	feedsTitle.textContent = i18nextInstance.t('feeds');
	fragmentStructure.querySelector('.card-body').appendChild(feedsTitle);

	const feedsList = document.createElement('ul');
	feedsList.classList.add('list-group', 'border-0', 'rounded-0');

	const feedsListItems = allStreams.map((feed) => {
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

const renderPosts = (currentPosts, readPosts, modalState, i18nextInstance) => {
	const { isInitiated, modalUI } = modalState;
	const {
		modal, modalTitle, modalText, modalButton, closeBtn, closeBtnSecond,
	} = modalUI;

	const listBox = document.querySelector('.posts');
	const fragmentStructure = document.createElement('div');
	fragmentStructure.classList.add('card', 'border-0');
	fragmentStructure.innerHTML = '<div class=\'card-body\'></div>';

	const list = document.createElement('ul');
	list.classList.add('list-group', 'border-0', 'rounded-0');

	const feedsTitle1 = document.createElement('h2');
	feedsTitle1.classList.add('card-title', 'h4');
	feedsTitle1.textContent = i18nextInstance.t('posts');
	fragmentStructure.querySelector('.card-body').appendChild(feedsTitle1);

	const postsItems = currentPosts.map(([postHash, post]) => {
		const postItem = document.createElement('li');
		postItem.className = 'list-group-item d-flex justify-content-between align-items-start border-0 border-end-0';

		const link = document.createElement('a');
		if (!readPosts.has(postHash)) link.classList.add('fw-bold');
		link.href = post.link;
		link.textContent = post.title;

		const btn = document.createElement('button');
		btn.className = 'btn btn-outline-primary btn-sm';
		btn.textContent = 'Просмотр';

		btn.addEventListener('click', (e) => {
			link.classList.remove('fw-bold');
			link.classList.add('fw-normal');
			readPosts.add(postHash);

			modalTitle.textContent = post.title;
			modalText.textContent = post.description;
			modalButton.href = post.link;

			if (!isInitiated) {
				const closeModal = () => {
					modal.style = 'display: none;';
					modal.classList.remove('show');
				};

				closeBtn.addEventListener('click', closeModal);
				closeBtnSecond.addEventListener('click', closeModal);
			}

			modal.style = 'display: block;';
			modal.classList.add('show');
		});

		postItem.append(link);
		postItem.append(btn);

		return postItem;
	});

	list.append(...postsItems);
	fragmentStructure.appendChild(list);
	listBox.innerHTML = '';
	listBox.appendChild(fragmentStructure);
};

export const renderStatus = (status, { t }) => {
	const feedBack = document.querySelector('.feedback');

	// console.log(status);

	if (status.success) {
		feedBack.textContent = t(status.success);
		feedBack.classList.remove('text-danger');
		feedBack.classList.add('text-success');
		return;
	}

	feedBack.textContent = t(`errors.${status.error}`);
	feedBack.classList.remove('text-success');
	feedBack.classList.add('text-danger');
};

const renderContent = ({ streams, modalState, status }, i18nextInstance) => {
	const { rssStreams, readPosts } = streams;
	const streamsValues = Object.values(rssStreams);
	const allStreams = streamsValues;
	const posts = [];

	streamsValues.forEach((stream) => posts.push(...Object.entries(stream.items)));

	renderFeeds(allStreams, i18nextInstance);
	renderPosts(posts, readPosts, modalState, i18nextInstance);
	renderStatus(status, i18nextInstance);
};

export default renderContent;
