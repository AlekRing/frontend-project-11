import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import i18next from 'i18next';
import { string } from 'yup';
import axios from 'axios';
import resources from './locales/index';
import { getLink, hashString } from './utilities';
import renderContent, { renderStatus } from './renderContent';

const link = string().url().required();

const fetchRSS = (url) => axios.get(getLink(url))
	.then(((response) => response))
	.catch((error) => new Error('network'));

const parseContent = (rowData) => {
	if (!rowData?.data?.contents) throw new Error('unknown');

	const parser = new DOMParser();
	const dom = parser.parseFromString(rowData.data.contents, 'text/xml');
	const parseError = dom.querySelector('parsererror');

	if (parseError) throw new Error('noRss');

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

const updateState = (state, parsedContent, url, hash) => {
	if (!parsedContent) throw new Error('unknown');

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

const updateFeeds = (state, i18nextInstance, handleError) => {
	const streams = Object.values(state.streams.rssStreams);
	const streamsHashes = Object.keys(state.streams.rssStreams);
	const promises = streams.map((stream) => fetchRSS(stream.url).then(parseContent));

	console.warn(state);

	Promise.all(promises)
		.then((values) => values.forEach((val, ind) => {
			updateState(state, val, val.url, streamsHashes[ind]);
			renderContent(state, i18nextInstance);
		}))
		.then(() => {
			if (state.timeoutId !== null) {
				clearTimeout(state.timeoutId);
				state.timeoutId = null;
			}

			state.timeoutId = setTimeout(updateFeeds, state.timeout, state, i18nextInstance, handleError);
		})
		.catch((error) => handleError(error));
};

const App = (state) => {
	const { ui } = state;

	const form = document.querySelector('.rss-form');
	ui.input = form.querySelector('#url-input');
	ui.modalUI.modalTitle = ui.modalUI.modal.querySelector('.modal-title');
	ui.modalUI.modalText = ui.modalUI.modal.querySelector('.text-break');
	ui.modalUI.modalButton = ui.modalUI.modal.querySelector('.btn-primary');
	ui.modalUI.closeBtn = ui.modalUI.modal.querySelector('.btn-secondary');
	ui.modalUI.closeBtnSecond = ui.modalUI.modal.querySelector('.btn-close');

	const i18nextInstance = i18next.createInstance();

	i18nextInstance.init({
		lng: 'ru',
		debug: false,
		resources,
	}).then(() => {
		form.addEventListener('submit', (e) => {
			e.preventDefault();

			state.status = {
				success: '',
				error: '',
			};

			const url = new FormData(e.target)?.get('url');
			const hash = hashString(url);

			const handleError = (error) => {
				console.error(error);
				form.reset();
				state.status.error = error.message;
				renderStatus(state.status, i18nextInstance);
				state.ui.input.classList.add('is-invalid');
			};

			if (state.streams.rssStreams[hash]) return handleError(new Error('exists'));

			link.validate(url)
				.then(fetchRSS)
				.then(parseContent)
				.then((parsed) => {
					form.reset();
					state.ui.input.focus();
					state.ui.input.classList.remove('is-invalid');

					updateState(state, parsed, url, hash);
					renderContent(state, i18nextInstance);

					if (state.timeoutId !== null) {
						clearTimeout(state.timeoutId);
						state.timeoutId = null;
					}

					state.timeoutId = setTimeout(() => {
						updateFeeds(state, i18nextInstance, handleError);
					}, state.timeout);
				})
				.catch((error) => (error.message === 'this must be a valid URL'
					? handleError(new Error('notUrl')) : handleError(error)));
		});
	});
};

export default App;
