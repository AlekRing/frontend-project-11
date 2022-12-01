/* eslint-disable import/prefer-default-export */

export const hashString = (str) => {
	let hash = 0;
	let chr;

	if (str?.length === 0) return hash;

	for (let i = 0; i < str.length; i += 1) {
		chr = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash |= 0;
	}

	return hash;
};
