import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Button, Backdrop, Fade } from '@mui/material';

function EmailModal({ open, handleClose, recipients }) {
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');

    const handleSendEmail = () => {
        const mailtoLink = `mailto:${recipients.join(';')}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailMessage)}`;
        window.open(mailtoLink, '_blank');
        handleClose(); 
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            BackdropProps={{
                style: { backgroundColor: 'rgba(0, 0, 0, 0.3)' }, 
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                }}
            >
                <Typography id="transition-modal-title" variant="h6" component="h2" sx={{ mb: 2 }}>
                    Send Survey Email
                </Typography>
                <TextField
                    fullWidth
                    label="Email Subject"
                    variant="outlined"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    margin="normal"
                />
                <TextField
                    fullWidth
                    label="Email Message"
                    variant="outlined"
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    margin="normal"
                    multiline
                    rows={4}
                />
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={handleSendEmail} sx={{ mr: 1 }}>
                        Send
                    </Button>
                    <Button variant="outlined" onClick={handleClose}>
                        Skip
                    </Button>
                </Box>
            </Box>
        </Modal >
    );
}

export default EmailModal;
