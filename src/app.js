import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import i18next from 'i18next';
import * as yup from 'yup';
import { string } from 'yup';
import resources from './locales/index';
import locale from './locales/yupLocale';
import axios from 'axios';
import { hashString } from './utilities';
import renderContent from './renderContent.js';

let link = string().url().required();

const fetchRSS = (url) => axios.get(`https://allorigins.hexlet.app/get?url=${encodeURIComponent(url)}`)
    .then((response => response))
    .catch((error) => error);

const parseContent = (rowData) => {
    if (!rowData?.data?.contents) throw new Error('Invalid row data');

    const parser = new DOMParser();

    const dom = parser.parseFromString(rowData.data.contents, 'text/xml');

    const parseError = dom.querySelector('parsererror');
    if (parseError) {
        const error = new Error(parseError.textContent);
        error.isParsingError = true;
        error.data = rowData;
        throw error;
    }

    const channelTitle = dom.querySelector('channel > title')?.textContent;
    const channelDescription = dom.querySelector('channel > description')?.textContent;

    const itemElements = dom.querySelectorAll('item');
    const items = [...itemElements].reduce((acc, val) => {
        const title = val.querySelector('title')?.textContent;
        const link = val.querySelector('link')?.textContent;
        const description = val.querySelector('description')?.textContent;

        return { ...acc, [hashString(title)]: { title, link, description }};
    }, {});

    return { title: channelTitle, description: channelDescription, items };
};

const updateState = ({streams, currentStream}, parsedContent) => {
    if (!parsedContent) throw new Error('No content to update the state was provided');

    const {url, hash} = currentStream;
    const stream = streams.rssStreams[hash];

    if (!stream) {
        streams.rssStreams[hash] = {...parsedContent, url: url};
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
            }
        }
    };
    const timeout = 5000;
    const form = document.querySelector('.rss-form');
    const input = form.querySelector('#url-input');
    const {modalState} = state;

    state.modalState.modalUI.modalTitle = modalState.modalUI.modal.querySelector('.modal-title');
    state.modalState.modalUI.modalText = modalState.modalUI.modal.querySelector('.text-break');
    state.modalState.modalUI.modalButton = modalState.modalUI.modal.querySelector('.btn-primary');
    state.modalState.modalUI.closeBtn = modalState.modalUI.modal.querySelector('.btn-secondary');
    state.modalState.modalUI.closeBtnSecond = modalState.modalUI.modal.querySelector('.btn-close');

    yup.setLocale({
        string: {
            url: () => ({ key: 'notUrl' }),
        },
        mixed: {
            required: () => ({ key: 'required' }),
            notOneOf: () => ({ key: 'exists' }),
        },
    });

    const i18nextInstance = i18next.createInstance();

    i18nextInstance.init({
        lng: 'ru',
        debug: false,
        resources
    }).then(() => {
        yup.setLocale(locale);

        const prepareData = (url) =>
            link.validate(url)
            .then(fetchRSS)
            .then(parseContent)
            .catch((error) => {
                console.error(error);
                input.classList.add('is-invalid');
            });

        const updateFeeds = (state, i18nextInstance) => {
            const streams = Object.values(state.streams.rssStreams);
            let activeIndex = 0;

            console.warn('state: ', state);

            const promises = streams.map((stream, index) => {
                if (stream.url === state.currentStream.url) activeIndex = index; 
                return prepareData(stream.url);
            });
            Promise.all(promises)
                .then(values => values.forEach((val, ind) => {
                    if (ind === activeIndex) updateState(state, val);
                    renderContent(state, i18nextInstance);
                }))
                .then(() => {
                    if (state.timeoutId !== null) {
                        clearTimeout(state.timeoutId);
                        state.timeoutId = null;
                    };

                    state.timeoutId = setTimeout(() => {
                        updateFeeds(state, i18nextInstance);
                    }, timeout);
                });
        };

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            if (state.timeoutId !== null) {
                clearTimeout(state.timeoutId);
                state.timeoutId = null;
            };
    
            const data = new FormData(e.target);
            const url = data.get('url');
            state.currentStream.url = url;

            const hash = hashString(state.currentStream.url);
            state.currentStream.hash = hash;

            if (state.streams.rssStreams[hash]) {
                console.error('Error: strem already exists');
                return;
            }
            
            prepareData(url)
            .then((parsed) => {
                updateState(state, parsed);
                renderContent(state, i18nextInstance);
                form.reset();
                input.focus();
                input.classList.remove('is-invalid');
            })
            .then(() => {
                state.timeoutId = setTimeout(() => {
                    updateFeeds(state, i18nextInstance);
                }, timeout);
            })
            .catch((err) => console.error(err));
        });
    });

    return 'Hello, world!';
};

export default App;
