import { getFeatureFlags } from './dataHandling';

(async () => {
    console.log(await getFeatureFlags());
})();