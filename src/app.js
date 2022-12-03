import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import i18next from 'i18next';
import * as yup from 'yup';
import { string } from 'yup';
import axios from 'axios';
import resources from './locales/index';
import locale from './locales/yupLocale';
import { hashString } from './utilities';
import renderContent, { renderStatus } from './renderContent';

const link = string().url().required();

const fetchRSS = (url) => axios.get(`https://allorigins.hexlet.app/get?url=${encodeURIComponent(url)}`)
	.then(((response) => response))
	.catch((error) => new Error('network'));

const parseContent = (rowData) => {
	// if (!rowData?.data?.contents) throw new Error('unknown');

	console.log(rowData);
	const parser = new DOMParser();

	const dom = parser.parseFromString(rowData.data.contents, 'text/xml');

	const parseError = dom.querySelector('parsererror');

	if (parseError) {
		console.log(parseError);
		throw new Error('noRss');
	}

	const channelTitle = dom.querySelector('channel > title')?.textContent;
	const channelDescription = dom.querySelector('channel > description')?.textContent;

	const itemElements = dom.querySelectorAll('item');
	const items = [...itemElements].reduce((acc, val) => {
		const title = val.querySelector('title')?.textContent;
		const link = val.querySelector('link')?.textContent;
		const description = val.querySelector('description')?.textContent;

		return { ...acc, [hashString(title)]: { title, link, description } };
	}, {});

	return { title: channelTitle, description: channelDescription, items };
};

const updateState = (state, parsedContent) => {
	if (!parsedContent) {
		state.status.error = 'unknown';
		throw new Error('unknown');
	}

	const { url, hash } = state.currentStream;
	const stream = state.streams.rssStreams[hash];

	if (!stream) {
		state.status.success = 'success';
		state.streams.rssStreams[hash] = { ...parsedContent, url };
		return;
	}

	Object.entries(parsedContent.items).forEach(([key, value]) => {
		if (!stream.items[key]) stream.items[key] = value;
	});
};

const App = () => {
	const state = {
		timeoutId: null,
		streams: {
			readPosts: new Set(),
			rssStreams: {},
		},
		currentStream: {
			url: '',
			hash: null,
		},
		modalState: {
			isInitiated: false,
			modalUI: {
				modal: document.getElementById('modal'),
			},
		},
		status: {
			success: '',
			error: '',
		},
	};
	const timeout = 5000;
	const form = document.querySelector('.rss-form');
	const input = form.querySelector('#url-input');
	const { modalState } = state;

	modalState.modalUI.modalTitle = modalState.modalUI.modal.querySelector('.modal-title');
	modalState.modalUI.modalText = modalState.modalUI.modal.querySelector('.text-break');
	modalState.modalUI.modalButton = modalState.modalUI.modal.querySelector('.btn-primary');
	modalState.modalUI.closeBtn = modalState.modalUI.modal.querySelector('.btn-secondary');
	modalState.modalUI.closeBtnSecond = modalState.modalUI.modal.querySelector('.btn-close');

	const i18nextInstance = i18next.createInstance();

	i18nextInstance.init({
		lng: 'ru',
		debug: false,
		resources,
	}).then(() => {
		yup.setLocale(locale);

		form.addEventListener('submit', (e) => {
			e.preventDefault();

			if (state.timeoutId !== null) {
				clearTimeout(state.timeoutId);
				state.timeoutId = null;
			}

			state.status = {
				success: '',
				error: '',
			};

			const data = new FormData(e.target);
			const url = data.get('url');
			state.currentStream.url = url;

			const hash = hashString(state.currentStream.url);
			state.currentStream.hash = hash;

			if (state.streams.rssStreams[hash]) {
				state.status.error = 'exists';
				renderStatus(state.status, i18nextInstance);
				return;
			}

			const prepareData = (url) => link.validate(url)
				.then(fetchRSS)
				.then(parseContent);

			const updateFeeds = (state, i18nextInstance) => {
				const streams = Object.values(state.streams.rssStreams);
				const promises = [];
				let activeIndex = 0;

				console.warn('updateFeeds Check: ', state.currentStream.url, 'STATE: ', state, 'streams: ', streams);

				if (!streams.length && state.currentStream.url) {
					promises.push(prepareData(state.currentStream.url));
				} else if (streams.length) {
					streams.forEach((stream, index) => {
						if (stream.url === state.currentStream.url) activeIndex = index;
						promises.push(prepareData(stream.url));
					});
				}

				Promise.all(promises)
					.then((values) => values.forEach((val, ind) => {
						if (ind === activeIndex) updateState(state, val);
						renderContent(state, i18nextInstance);
					}))
					.then(() => {
						if (state.timeoutId !== null) {
							clearTimeout(state.timeoutId);
							state.timeoutId = null;
						}

						state.timeoutId = setTimeout(() => {
							updateFeeds(state, i18nextInstance);
						}, timeout);
					})
					.catch((error) => {
						console.error(error);
						state.status.error = error.message;
						renderStatus(state.status, i18nextInstance);
						input.classList.add('is-invalid');
					});
			};

			updateFeeds(state, i18nextInstance);

			form.reset();
			input.focus();
			input.classList.remove('is-invalid');

			// prepareData(url)
			// 	.then((parsed) => {
			// 		updateState(state, parsed);
			// 		renderContent(state, i18nextInstance);
			// 		form.reset();
			// 		input.focus();
			// 		input.classList.remove('is-invalid');
			// 	})
			// 	.then(() => {
			// 		state.timeoutId = setTimeout(() => {
			// 			updateFeeds(state, i18nextInstance);
			// 		}, timeout);
			// 	})
			// 	.catch((error) => {
			// 		console.error(error);
			// 		state.status.error = error.message;
			// 		renderStatus(state.status, i18nextInstance);
			// 		input.classList.add('is-invalid');
			// 	});
		});
	});
};

export default App;
