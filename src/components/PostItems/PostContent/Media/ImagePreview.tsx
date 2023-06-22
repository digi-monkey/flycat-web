import { Dialog, DialogContent } from '@mui/material';
import { useState } from 'react';

import styles from '../index.module.scss';

export function ImagePreview({ url }: { url: string }) {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <li>
      <div>
        <img  src={url} alt="img" onClick={() => setShowPopup(true)} />
        <Dialog
          disableAutoFocus
          open={showPopup}
          className={styles.dialog}
          onClose={() => setShowPopup(false)}
        >
          <DialogContent>
            <img
              src={url}
              alt="img"
              style={{
                maxWidth: '100%',
                maxHeight: '700px',
                verticalAlign: 'middle',
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </li>
  );
}
