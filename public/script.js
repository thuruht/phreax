// Global variables
let contacts = [];
let isAuthenticated = false;

// DOM elements
const loginSection = document.getElementById('login-section');
const directorySection = document.getElementById('directory-section');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const searchInput = document.getElementById('search-input');
const contactsContainer = document.getElementById('contacts-container');
const editModal = document.getElementById('edit-modal');
const viewModal = document.getElementById('view-modal');
const editForm = document.getElementById('edit-form');
const closeModal = document.querySelector('.close');
const closeViewModal = document.querySelector('.close-view');
const tabs = document.querySelectorAll('.tab');
const directoryTab = document.getElementById('directory-tab');
const addContactTab = document.getElementById('add-contact-tab');
const addContactForm = document.getElementById('add-contact-form');
const deleteContactBtn = document.getElementById('delete-contact-btn');

// Error message elements
const loginError = document.getElementById('login-error');
const addContactError = document.getElementById('add-contact-error');
const editError = document.getElementById('edit-error');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already authenticated
    checkAuthStatus();
    
    // Event listeners
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    searchInput.addEventListener('input', debounce(filterContacts, 300));
    editForm.addEventListener('submit', handleEditSubmit);
    closeModal.addEventListener('click', () => hideModal(editModal));
    closeViewModal.addEventListener('click', () => hideModal(viewModal));
    addContactForm.addEventListener('submit', handleAddContact);
    deleteContactBtn.addEventListener('click', handleDeleteContact);
    
    // Image preview for add contact form
    const imageFileInput = document.getElementById('add-image-file');
    const imageUrlInput = document.getElementById('add-image');
    const imagePreview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    
    // Image preview for edit modal
    const editImageFileInput = document.getElementById('edit-image-file');
    const editImageUrlInput = document.getElementById('edit-image');
    const editImagePreview = document.getElementById('edit-image-preview');
    const editPreviewImg = document.getElementById('edit-preview-img');
    
    imageFileInput.addEventListener('change', handleImageFileChange);
    imageUrlInput.addEventListener('input', debounce(handleImageUrlChange, 500));
    
    editImageFileInput.addEventListener('change', handleEditImageFileChange);
    editImageUrlInput.addEventListener('input', debounce(handleEditImageUrlChange, 500));
    
    // Tab switching - support click, pointerup and touchstart fallbacks for mobile
    tabs.forEach(tab => {
        // existing click handler
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchTab(tabName);
        });

        // pointerup helps on many mobile browsers where click can be delayed or swallowed
        tab.addEventListener('pointerup', (e) => {
            // only primary pointer
            if (e.button && e.button !== 0) return;
            const tabName = tab.getAttribute('data-tab');
            switchTab(tabName);
        }, { passive: true });

        // fallback for older mobile browsers without PointerEvent
        tab.addEventListener('touchstart', (e) => {
            const tabName = tab.getAttribute('data-tab');
            if (tabName) {
                switchTab(tabName);
            }
        }, { passive: true });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            hideModal(editModal);
        }
        if (e.target === viewModal) {
            hideModal(viewModal);
        }
    });
    
    // Handle escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideModal(editModal);
            hideModal(viewModal);
        }
    });
});

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showError(element, message) {
    element.textContent = message;
    element.classList.remove('hidden');
    setTimeout(() => {
        element.classList.add('hidden');
    }, 5000);
}

function hideModal(modal) {
    modal.classList.add('hidden');
    // Reset forms when closing modals
    if (modal === editModal) {
        document.getElementById('edit-form').reset();
        document.getElementById('edit-image-preview').classList.add('hidden');
        editError.classList.add('hidden');
    }
}

function switchTab(tabName) {
    // Update active tab
    tabs.forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Show appropriate content
    if (tabName === 'directory') {
        directoryTab.classList.remove('hidden');
        addContactTab.classList.add('hidden');
    } else {
        directoryTab.classList.add('hidden');
        addContactTab.classList.remove('hidden');
        // Reset the add contact form when switching to it
        document.getElementById('add-contact-form').reset();
        document.getElementById('image-preview').classList.add('hidden');
        addContactError.classList.add('hidden');
    }
}

// Authentication functions
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/status', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.authenticated) {
                isAuthenticated = true;
                showDirectory();
                await loadContacts();
            }
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const submitButton = e.target.querySelector('button[type="submit"]');
    
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner"></span>Establishing connection...';
    submitButton.classList.add('glitch');
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password }),
            credentials: 'include'
        });
        
        if (response.ok) {
            isAuthenticated = true;
            // Add terminal effects
            submitButton.innerHTML = '<span style="color: #40ff80;">[F&F ACCESS GRANTED]</span>';
            setTimeout(() => {
                showDirectory();
                // Check authentication status before loading contacts
                checkAuthAndLoadContacts();
            }, 1000);
            loginError.classList.add('hidden');
        } else {
            showError(loginError, '[F&F ACCESS DENIED] Invalid directory password. Please try again.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError(loginError, '[F&F CONNECTION ERROR] Unable to establish connection. Network failure detected.');
    } finally {
        setTimeout(() => {
            submitButton.disabled = false;
            submitButton.textContent = 'Access F&F Directory';
            submitButton.classList.remove('glitch');
        }, 2000);
    }
}

async function handleLogout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        isAuthenticated = false;
        loginSection.classList.remove('hidden');
        directorySection.classList.add('hidden');
        document.getElementById('password').value = '';
        contacts = [];
    } catch (error) {
        console.error('Logout error:', error);
    }
}

function showDirectory() {
    loginSection.classList.add('hidden');
    directorySection.classList.remove('hidden');
}

// Check auth status before loading contacts
async function checkAuthAndLoadContacts() {
    try {
        // First verify the session is valid
        const response = await fetch('/api/auth/status', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.authenticated) {
                // If authenticated, load contacts
                await loadContacts();
            } else {
                // If not authenticated, show login
                showLogin();
                const loginError = document.getElementById('login-error');
                loginError.textContent = 'Session expired. Please log in again.';
                loginError.classList.remove('hidden');
            }
        } else {
            console.error('Failed to check authentication status');
            // Try loading contacts anyway
            await loadContacts();
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        // Try loading contacts anyway
        await loadContacts();
    }
}

// Contact management functions
async function loadContacts() {
    const loadingSpinner = document.getElementById('loading-spinner');
    
    try {
        if (loadingSpinner) {
            loadingSpinner.style.display = 'block';
        }
        
        const response = await fetch('/api/contacts', {
            credentials: 'include'
        });
        
        if (response.ok) {
            contacts = await response.json();
            renderContacts(contacts);
        } else {
            console.error('Failed to load contacts');
            contactsContainer.innerHTML = '<p class="error-message">Failed to load contacts. Please refresh the page.</p>';
        }
    } catch (error) {
        console.error('Error loading contacts:', error);
        contactsContainer.innerHTML = '<p class="error-message">Error loading contacts. Please check your connection.</p>';
    } finally {
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }
    }
}

function renderContacts(contactsToRender) {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
    }
    
    contactsContainer.innerHTML = '';
    
    if (contactsToRender.length === 0) {
        contactsContainer.innerHTML = '<p class="loading">[F&F SYSTEM] Directory empty. No community contacts found.</p>';
        return;
    }
    
    contactsToRender.forEach(contact => {
        const contactCard = document.createElement('div');
        contactCard.className = 'contact-card';
        
        // Create fallback image URL and sanitize before injecting
        const imageUrl = sanitizeImageUrl(contact.image_url || createAvatarUrl(contact.name));

        contactCard.innerHTML = `
            <div class="contact-header">
                <img src="${escapeHtml(imageUrl)}" 
                     alt="${escapeHtml(contact.name)}" 
                     class="contact-image"
                     onerror="this.src='${escapeHtml(createAvatarUrl(contact.name))}'">
                <div class="contact-name">${escapeHtml(contact.name)}</div>
            </div>
            <div class="contact-details">
                ${contact.phone ? `<div class="contact-field"><span class="contact-field-label">Phone:</span> ${escapeHtml(contact.phone)}</div>` : ''}
                ${contact.discord ? `<div class="contact-field"><span class="contact-field-label">Discord:</span> ${escapeHtml(contact.discord)}</div>` : ''}
                <div class="contact-actions">
                    <button class="view-more" data-id="${contact.id}">View Details</button>
                    <button class="edit-contact" data-id="${contact.id}">Edit Contact</button>
                </div>
            </div>
        `;
        
        contactsContainer.appendChild(contactCard);
    });
    
    // Add event listeners to the buttons
    document.querySelectorAll('.view-more').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = e.target.getAttribute('data-id');
            viewContactDetails(id);
        });
    });
    
    document.querySelectorAll('.edit-contact').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = e.target.getAttribute('data-id');
            openEditModal(id);
        });
    });
}

function createAvatarUrl(name) {
    // Use local SVG placeholder instead of external service
    return '/avatar-placeholder.svg';
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Sanitize and validate user-supplied URLs for image src usage.
// Returns a safe URL or the local placeholder when input is invalid or unsafe.
function sanitizeImageUrl(url) {
    if (!url) return createAvatarUrl('');
    try {
        // Allow relative paths and common safe protocols
        if (url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:')) {
            return url;
        }
        const parsed = new URL(url);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.href;
        }
    } catch (e) {
        // fall through to placeholder
    }
    return createAvatarUrl('');
}

// Create a safe tel: href from freeform phone input (keep digits and plus only)
function sanitizeTelHref(phone) {
    if (!phone) return '';
    const filtered = phone.replace(/[^0-9+]/g, '');
    return filtered ? `tel:${filtered}` : '';
}

// Build safe URLs for social usernames (small whitelist)
function socialUrl(platform, username) {
    if (!username) return '';
    const clean = username.replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!clean) return '';
    switch (platform) {
        case 'instagram':
            return `https://instagram.com/${encodeURIComponent(clean)}`;
        case 'telegram':
            return `https://t.me/${encodeURIComponent(clean)}`;
        default:
            return '';
    }
}

function viewContactDetails(id) {
    const contact = contacts.find(c => c.id === id);
    if (!contact) return;
    
    const imageUrl = sanitizeImageUrl(contact.image_url || createAvatarUrl(contact.name));
    const telHref = contact.phone ? sanitizeTelHref(contact.phone) : '';
    const instagramHref = contact.instagram ? socialUrl('instagram', contact.instagram) : '';
    const telegramHref = contact.telegram ? socialUrl('telegram', contact.telegram) : '';
    
    const viewContent = document.getElementById('view-contact-content');
    viewContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="${escapeHtml(imageUrl)}" 
                 alt="${escapeHtml(contact.name)}" 
                 class="contact-image-large"
                 onerror="this.src='${escapeHtml(createAvatarUrl(contact.name))}'">
            <h3>${escapeHtml(contact.name)}</h3>
        </div>
        <div class="contact-details-full">
            ${contact.phone ? `<div class="contact-field"><span class="contact-field-label">Phone:</span> ${telHref ? `<a href="${escapeHtml(telHref)}">${escapeHtml(contact.phone)}</a>` : escapeHtml(contact.phone)}</div>` : ''}
            ${contact.discord ? `<div class="contact-field"><span class="contact-field-label">Discord:</span> ${escapeHtml(contact.discord)}</div>` : ''}
            ${contact.instagram ? `<div class="contact-field"><span class="contact-field-label">Instagram:</span> ${instagramHref ? `<a href="${escapeHtml(instagramHref)}" target="_blank" rel="noopener noreferrer">@${escapeHtml(contact.instagram)}</a>` : `@${escapeHtml(contact.instagram)}`}</div>` : ''}
            ${contact.telegram ? `<div class="contact-field"><span class="contact-field-label">Telegram:</span> ${telegramHref ? `<a href="${escapeHtml(telegramHref)}" target="_blank" rel="noopener noreferrer">@${escapeHtml(contact.telegram)}</a>` : `@${escapeHtml(contact.telegram)}`}</div>` : ''}
            ${contact.signal ? `<div class="contact-field"><span class="contact-field-label">Signal:</span> ${escapeHtml(contact.signal)}</div>` : ''}
            ${contact.address ? `<div class="contact-field"><span class="contact-field-label">Address:</span> ${escapeHtml(contact.address).replace(/\n/g, '<br>')}</div>` : ''}
            ${contact.notes ? `<div class="contact-field"><span class="contact-field-label">Notes:</span> ${escapeHtml(contact.notes).replace(/\n/g, '<br>')}</div>` : ''}
        </div>
    `;
    
    viewModal.classList.remove('hidden');
}

function openEditModal(id) {
    const contact = contacts.find(c => c.id === id);
    if (!contact) return;
    
    document.getElementById('edit-id').value = contact.id;
    document.getElementById('edit-name').value = contact.name;
    document.getElementById('edit-phone').value = contact.phone || '';
    document.getElementById('edit-discord').value = contact.discord || '';
    document.getElementById('edit-instagram').value = contact.instagram || '';
    document.getElementById('edit-telegram').value = contact.telegram || '';
    document.getElementById('edit-signal').value = contact.signal || '';
    document.getElementById('edit-address').value = contact.address || '';
    document.getElementById('edit-notes').value = contact.notes || '';
    document.getElementById('edit-image').value = contact.image_url || '';
    document.getElementById('edit-personal-code').value = '';
    
    editError.classList.add('hidden');
    editModal.classList.remove('hidden');
}

async function handleEditSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('edit-id').value;
    const personalCode = document.getElementById('edit-personal-code').value;
    const submitButton = e.target.querySelector('button[type="submit"]');
    
    if (!personalCode.trim()) {
        showError(editError, 'Personal code is required');
        return;
    }
    
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner"></span>Processing modifications...';
    submitButton.classList.add('glitch');
    
    // Handle image upload if a file was selected
    let imageUrl = document.getElementById('edit-image').value.trim();
    const imageFile = document.getElementById('edit-image-file').files[0];
    
    if (imageFile) {
        try {
            const uploadedImageUrl = await uploadImage(imageFile);
            if (uploadedImageUrl) {
                imageUrl = uploadedImageUrl;
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            showError(editError, 'Failed to upload image, but contact will be updated without it.');
        }
    }
    
    const contactData = {
        name: document.getElementById('edit-name').value.trim(),
        phone: document.getElementById('edit-phone').value.trim(),
        discord: document.getElementById('edit-discord').value.trim(),
        instagram: document.getElementById('edit-instagram').value.trim(),
        telegram: document.getElementById('edit-telegram').value.trim(),
        signal: document.getElementById('edit-signal').value.trim(),
        address: document.getElementById('edit-address').value.trim(),
        notes: document.getElementById('edit-notes').value.trim(),
        image_url: imageUrl,
        personal_code: personalCode
    };
    
    try {
        const response = await fetch(`/api/contacts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contactData),
            credentials: 'include'
        });
        
        if (response.ok) {
            await loadContacts();
            hideModal(editModal);
            // Show success message briefly
            const successMsg = document.createElement('div');
            successMsg.className = 'success-message';
            successMsg.textContent = '[F&F DATABASE] Contact record updated successfully. Changes saved to directory.';
            contactsContainer.insertBefore(successMsg, contactsContainer.firstChild);
            setTimeout(() => successMsg.remove(), 4000);
        } else {
            const errorData = await response.json();
            showError(editError, `[F&F UPDATE FAILED] ${errorData.error || 'Contact modification rejected by authentication protocol'}`);
        }
    } catch (error) {
        console.error('Error updating contact:', error);
        showError(editError, '[F&F SYSTEM ERROR] Database modification failed. Connection unstable.');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Execute Changes';
        submitButton.classList.remove('glitch');
    }
}

async function handleDeleteContact() {
    const id = document.getElementById('edit-id').value;
    const personalCode = document.getElementById('edit-personal-code').value;
    
    if (!personalCode.trim()) {
        showError(editError, 'Personal code is required to delete contact');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
        return;
    }
    
    deleteContactBtn.disabled = true;
    deleteContactBtn.textContent = 'Deleting...';
    
    try {
        const response = await fetch(`/api/contacts/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ personal_code: personalCode }),
            credentials: 'include'
        });
        
        if (response.ok) {
            await loadContacts();
            hideModal(editModal);
            // Show success message briefly
            const successMsg = document.createElement('div');
            successMsg.className = 'success-message';
            successMsg.textContent = 'Contact deleted successfully!';
            contactsContainer.insertBefore(successMsg, contactsContainer.firstChild);
            setTimeout(() => successMsg.remove(), 3000);
        } else {
            const errorData = await response.json();
            showError(editError, errorData.error || 'Failed to delete contact');
        }
    } catch (error) {
        console.error('Error deleting contact:', error);
        showError(editError, 'Failed to delete contact. Please try again.');
    } finally {
        deleteContactBtn.disabled = false;
        deleteContactBtn.textContent = 'Delete Contact';
    }
}

async function handleAddContact(e) {
    e.preventDefault();
    
    const submitButton = document.getElementById('add-submit-btn');
    const personalCode = document.getElementById('add-personal-code').value.trim() || 'please';
    
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner"></span>Adding to F&F directory...';
    submitButton.classList.add('glitch');
    
    // Handle image upload if a file was selected
    let imageUrl = document.getElementById('add-image').value.trim();
    const imageFile = document.getElementById('add-image-file').files[0];
    
    if (imageFile) {
        try {
            const uploadedImageUrl = await uploadImage(imageFile);
            if (uploadedImageUrl) {
                imageUrl = uploadedImageUrl;
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            showError(addContactError, 'Failed to upload image, but contact will be created without it.');
        }
    }
    
    const contactData = {
        name: document.getElementById('add-name').value.trim(),
        phone: document.getElementById('add-phone').value.trim(),
        discord: document.getElementById('add-discord').value.trim(),
        instagram: document.getElementById('add-instagram').value.trim(),
        telegram: document.getElementById('add-telegram').value.trim(),
        signal: document.getElementById('add-signal').value.trim(),
        address: document.getElementById('add-address').value.trim(),
        notes: document.getElementById('add-notes').value.trim(),
        image_url: imageUrl,
        personal_code: personalCode
    };
    
    try {
        const response = await fetch('/api/contacts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contactData),
            credentials: 'include'
        });
        
        if (response.ok) {
            await loadContacts();
            
            // Reset form
            document.getElementById('add-contact-form').reset();
            document.getElementById('image-preview').classList.add('hidden');
            
            // Switch back to directory tab
            switchTab('directory');
            
            // Show success message with personal code
            const successMsg = document.createElement('div');
            successMsg.className = 'success-message';
            successMsg.innerHTML = `Contact added successfully!<br><strong>Your personal code is: ${personalCode}</strong><br><small>Save this code - you'll need it to edit your contact later!</small>`;
            contactsContainer.insertBefore(successMsg, contactsContainer.firstChild);
            setTimeout(() => successMsg.remove(), 8000);
        } else {
            const errorData = await response.json();
            showError(addContactError, errorData.error || 'Failed to add contact');
        }
    } catch (error) {
        console.error('Error adding contact:', error);
        showError(addContactError, 'Failed to add contact. Please try again.');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Add Contact';
    }
}

async function uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/images', {
        method: 'POST',
        body: formData,
        credentials: 'include'
    });
    
    const data = await response.json();
    if (response.ok && data && data.url) {
        return data.url;
    }

    const err = data && data.error ? data.error : 'Upload failed';
    throw new Error(err);
}

function handleEditImageFileChange(e) {
    const file = e.target.files[0];
    const editImagePreview = document.getElementById('edit-image-preview');
    const editPreviewImg = document.getElementById('edit-preview-img');
    const editImageUrlInput = document.getElementById('edit-image');
    
    if (file) {
        // Clear URL input when file is selected
        editImageUrlInput.value = '';
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            e.target.value = '';
            return;
        }
        
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('File size must be less than 5MB.');
            e.target.value = '';
            return;
        }
        
        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            editPreviewImg.src = e.target.result;
            editImagePreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    } else {
        editImagePreview.classList.add('hidden');
    }
}

function handleEditImageUrlChange(e) {
    const url = e.target.value.trim();
    const editImagePreview = document.getElementById('edit-image-preview');
    const editPreviewImg = document.getElementById('edit-preview-img');
    const editImageFileInput = document.getElementById('edit-image-file');
    
    if (url) {
        // Clear file input when URL is entered
        editImageFileInput.value = '';
        
        // Show preview
        editPreviewImg.src = url;
        editImagePreview.classList.remove('hidden');
        
        // Hide preview if image fails to load
        editPreviewImg.onerror = () => {
            editImagePreview.classList.add('hidden');
        };
    } else {
        editImagePreview.classList.add('hidden');
    }
}

function handleImageFileChange(e) {
    const file = e.target.files[0];
    const imagePreview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const imageUrlInput = document.getElementById('add-image');
    
    if (file) {
        // Clear URL input when file is selected
        imageUrlInput.value = '';
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            e.target.value = '';
            return;
        }
        
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('File size must be less than 5MB.');
            e.target.value = '';
            return;
        }
        
        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            imagePreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    } else {
        imagePreview.classList.add('hidden');
    }
}

function handleImageUrlChange(e) {
    const url = e.target.value.trim();
    const imagePreview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const imageFileInput = document.getElementById('add-image-file');
    
    if (url) {
        // Clear file input when URL is entered
        imageFileInput.value = '';
        
        // Show preview
        previewImg.src = url;
        imagePreview.classList.remove('hidden');
        
        // Hide preview if image fails to load
        previewImg.onerror = () => {
            imagePreview.classList.add('hidden');
        };
    } else {
        imagePreview.classList.add('hidden');
    }
}

function filterContacts() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (!searchTerm) {
        renderContacts(contacts);
        return;
    }
    
    const filteredContacts = contacts.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm) ||
        (contact.phone && contact.phone.toLowerCase().includes(searchTerm)) ||
        (contact.discord && contact.discord.toLowerCase().includes(searchTerm)) ||
        (contact.instagram && contact.instagram.toLowerCase().includes(searchTerm)) ||
        (contact.telegram && contact.telegram.toLowerCase().includes(searchTerm)) ||
        (contact.signal && contact.signal.toLowerCase().includes(searchTerm)) ||
        (contact.address && contact.address.toLowerCase().includes(searchTerm)) ||
        (contact.notes && contact.notes.toLowerCase().includes(searchTerm))
    );
    
    renderContacts(filteredContacts);
}
