import fetch from 'isomorphic-fetch';

/**
 * Retrieves json data from url resource
 * @param  {string} url - The URL of the resource which is being fetched
 * @param  {object} options - see: https://github.github.io/fetch/#options
 * @return {object} json with response coming from resource
 */
export const isoFetch = (url, options) => {

  fetch(url, options).then(
    (response) => {
      if (response.status >= 400) {
        throw new Error('Bad response from server');
      }
      return response.json();
    });

};
