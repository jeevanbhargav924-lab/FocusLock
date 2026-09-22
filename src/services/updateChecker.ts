import { Linking } from 'react-native';

/**
 * FocusLock App Version Constants
 * Keep in sync with android/app/build.gradle defaultConfig:
 * versionCode: 6, versionName: "1.0.5"
 */
export const CURRENT_VERSION_CODE = 6;
export const CURRENT_VERSION_NAME = '1.0.5';

// Remote URL where version.json is hosted (GitHub raw URL for main branch)
export const DEFAULT_VERSION_CONFIG_URL =
  'https://raw.githubusercontent.com/jeevanbhargav924-lab/FocusLock/main/version.json';

export interface UpdateInfo {
  hasUpdate: boolean;
  isForced: boolean;
  latestVersion: string;
  latestVersionCode: number;
  title: string;
  releaseNotes: string;
  updateUrl: string;
}

/**
 * Checks remote version.json to determine if a newer version or forced update is required.
 * Returns null if network is unavailable or request fails.
 */
export async function checkForAppUpdate(
  configUrl: string = DEFAULT_VERSION_CONFIG_URL
): Promise<UpdateInfo | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(`${configUrl}?t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const latestCode = Number(data.latestVersionCode || 0);
    const minSupportedCode = Number(data.minSupportedVersionCode || 0);

    const hasUpdate = latestCode > CURRENT_VERSION_CODE;
    const isForced =
      Boolean(data.forceUpdate) || CURRENT_VERSION_CODE < minSupportedCode;

    return {
      hasUpdate,
      isForced,
      latestVersion: data.latestVersion || `${latestCode}.0`,
      latestVersionCode: latestCode,
      title: data.title || 'Update Available',
      releaseNotes:
        data.releaseNotes ||
        'A new version of FocusLock is available with performance improvements and bug fixes.',
      updateUrl:
        data.updateUrl ||
        'https://play.google.com/store/apps/details?id=com.focuslock.productivity',
    };
  } catch (error) {
    // Fail silently so the app runs smoothly offline
    console.log('[UpdateChecker] Offline or update check skipped:', error);
    return null;
  }
}

/**
 * Opens the app store or direct download link
 */
export function openStoreUpdate(url: string) {
  Linking.canOpenURL(url)
    .then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to standard web URL
        Linking.openURL(
          'https://play.google.com/store/apps/details?id=com.focuslock.productivity'
        );
      }
    })
    .catch(err => {
      console.warn('[UpdateChecker] Failed to open update link:', err);
    });
}
