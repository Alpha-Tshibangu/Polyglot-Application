// src/components/styles.ts

export const thumbnailStyles = `
  .local-thumbnail {
    transition: all 0.3s ease-out;
  }

  .local-thumbnail.transitioning {
    transition: all 0.5s ease-out;
  }

  .str-video__participant-view {
    margin: 0 !important;
    max-width: none !important;
    width: 100% !important;
    height: 100% !important;
  }
  
  .str-video__participant-view > div {
    max-width: none !important;
    height: 100% !important;
  }
  
  .str-video__participant-view video {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
  }
  
  .str-video__participant-view * {
    max-width: none !important;
  }
  
  .str-video__participant-view-video-wrapper {
    max-width: none !important;
    width: 100% !important;
    height: 100% !important;
  }

  .str-video__call-controls__button .str-video__icon--ellipsis {
    display: none !important;
  }

  .str-video__participant-details {
    display: none !important;
  }
`;

export const THUMBNAIL_WIDTH = 260;
export const THUMBNAIL_HEIGHT = 195;
export const INITIAL_POSITION = {
  x: window.innerWidth - THUMBNAIL_WIDTH - 20,
  y: 20,
};