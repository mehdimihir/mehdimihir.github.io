// Mehdi Mihir
// Software Engineering Portfolio
// script.js

$(document).ready(function() {
    // Variables to track windows
    var windowPositions = {};
    var windowSizes = {};
    var activeWindowId = null;
    var windowZIndexCounter = 1000;
    
    // Initialize closed windows tracking
    if (!sessionStorage.getItem('closedWindows')) {
        sessionStorage.setItem('closedWindows', JSON.stringify([]));
    }
    
    // Hide all windows initially
    $('.window').hide();
    
    // Create desktop icons
    createDesktopIcons();
    
    // Update the clock
    function updateClock() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12; // Convert 0 to 12
        
        $('#clock').text(`${hours}:${minutes} ${ampm}`);
    }
    
    // Update clock every minute
    updateClock();
    setInterval(updateClock, 60000);
    
    // Function to make a window active (bring to front)
    function makeWindowActive(windowId) {
        // Reset z-index for all windows
        $(".window").each(function() {
            $(this).css('z-index', 1);
        });
        
        // Set active window to top z-index
        $("#" + windowId).css('z-index', windowZIndexCounter++);
        activeWindowId = windowId;
        
        // Update taskbar active state
        $(".taskbar-button").removeClass('active');
        $(`.taskbar-button[data-window="${windowId}"]`).addClass('active');
        
        // Remove minimized state if applicable
        $("#" + windowId).removeClass('minimized');
    }
    
    // Function to minimize window
    function minimizeWindow(windowId) {
        // Save position if not already saved
        if (!windowPositions[windowId]) {
            windowPositions[windowId] = {
                top: $("#" + windowId).css("top"),
                left: $("#" + windowId).css("left")
            };
        }
        
        // Hide the window
        $("#" + windowId).addClass('minimized').hide();
        
        // Update taskbar
        $(`.taskbar-button[data-window="${windowId}"]`).removeClass('active');
    }
    
    // Function to restore a minimized window
    function restoreWindow(windowId) {
        // If we have saved position, restore it
        if (windowPositions[windowId]) {
            $("#" + windowId).css({
                'top': windowPositions[windowId].top,
                'left': windowPositions[windowId].left
            });
        }
        
        // Show the window
        $("#" + windowId).removeClass('minimized').show();
        
        // Make it active
        makeWindowActive(windowId);
    }
    
    // Function to close window
    function closeWindow(windowId) {
        // Hide the window
        $("#" + windowId).hide();
        
        // Remove from taskbar
        $(`.taskbar-button[data-window="${windowId}"]`).remove();
        
        // Add to closed windows list
        const closedWindows = sessionStorage.getItem('closedWindows') ? 
            JSON.parse(sessionStorage.getItem('closedWindows')) : [];
        
        if (!closedWindows.includes(windowId)) {
            closedWindows.push(windowId);
            sessionStorage.setItem('closedWindows', JSON.stringify(closedWindows));
        }
    }
    
    // Windows are initially shown based on hash or default to about
    initializeWindows();
    
    // Change window based on navigation
    $('.sidebar a').on('click', function(e) {
        e.preventDefault();
        const target = $(this).attr('href').substring(1);
        const windowId = target + '-window';
        
        // If the window is already visible, just bring it to front
        if ($("#" + windowId).is(':visible') && !$("#" + windowId).hasClass('minimized')) {
            makeWindowActive(windowId);
        } else if ($("#" + windowId).hasClass('minimized')) {
            // If minimized, restore it
            restoreWindow(windowId);
        } else {
            // Otherwise, open it
            openWindow(target);
        }
        
        // Update URL hash without re-triggering hashchange event
        history.replaceState(null, null, `#${target}`);
    });
    
    // Window controls functionality
    $(document).on('click', '.window-minimize', function() {
        const windowId = $(this).closest('.window').attr('id');
        minimizeWindow(windowId);
    });
    
    // Window closing functionality
    $(document).on('click', '.window-close', function() {
        const windowId = $(this).closest('.window').attr('id');
        closeWindow(windowId);
    });
    
    // Handle window focus
    $(document).on('mousedown', '.window', function() {
        const windowId = $(this).attr('id');
        if (!$(this).hasClass('minimized') && $(this).is(':visible')) {
            makeWindowActive(windowId);
        }
    });
    
    // Simplified context menu
    $(document).on('contextmenu', function(e) {
        e.preventDefault();
        
        // Remove any existing context menu
        $('.context-menu').remove();
        
        // Create new context menu
        const contextMenu = $(`
            <div class="context-menu">
                <div class="context-menu-item" id="context-refresh">Refresh</div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" id="context-tile">Tile Windows</div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" id="context-properties">Properties</div>
            </div>
        `);
        
        // Position the menu
        contextMenu.css({
            top: e.pageY + 'px',
            left: e.pageX + 'px'
        });
        
        // Add to the body
        $('body').append(contextMenu);
        
        // Handle menu item clicks
        $('#context-refresh').on('click', function() {
            location.reload();
        });
        
        $('#context-tile').on('click', function() {
            tileWindows();
        });
        
        $('#context-properties').on('click', function() {
            alert('Created by Mehdi Mihir 2025');
        });
        
        // Close the menu when clicking elsewhere
        $(document).on('click', function() {
            $('.context-menu').remove();
        });
    });
    
    // Function to tile windows
    function tileWindows() {
        const visibleWindows = $('.window:visible').not('.minimized');
        const count = visibleWindows.length;
        
        if (count > 0) {
            const cols = Math.ceil(Math.sqrt(count));
            const rows = Math.ceil(count / cols);
            
            const windowWidth = Math.floor(window.innerWidth / cols);
            const windowHeight = Math.floor((window.innerHeight - 40) / rows); // Subtract taskbar height
            
            visibleWindows.each(function(index) {
                const row = Math.floor(index / cols);
                const col = index % cols;
                
                $(this).css({
                    left: col * windowWidth + 'px',
                    top: row * windowHeight + 'px',
                    width: (windowWidth - 10) + 'px',
                    height: (windowHeight - 10) + 'px'
                });
            });
        }
    }
    
    // Listen for hash changes
    $(window).on('hashchange', function() {
        initializeWindows();
    });
    
    // Function to initialize windows based on hash
    function initializeWindows() {
        const hash = window.location.hash.substring(1) || 'about';
        const windowId = hash + '-window';
        
        // Get the list of deliberately closed windows
        const closedWindows = sessionStorage.getItem('closedWindows') ? 
            JSON.parse(sessionStorage.getItem('closedWindows')) : [];
        
        // Check if this window was deliberately closed by user
        if (closedWindows.includes(windowId)) {
            return;
        }
        
        // Clear taskbar
        $('.taskbar-buttons').empty();
        
        // Hide all windows first
        $('.window').hide();
        
        // Open the default window
        openWindow(hash);
    }
    
    // Function to add a window to taskbar
    function addToTaskbar(windowId, title) {
        // Check if this window is already in taskbar
        if ($(`.taskbar-button[data-window="${windowId}"]`).length === 0) {
            // Add it to taskbar
            $('.taskbar-buttons').append(
                `<div class="taskbar-button active" data-window="${windowId}">
                    ${title}
                </div>`
            );
        } else {
            // Just mark it as active
            $(`.taskbar-button[data-window="${windowId}"]`).addClass('active');
        }
    }
    
    // Function to open a window
    function openWindow(sectionName) {
        const windowId = sectionName + '-window';
        const windowEl = $(`#${windowId}`);
        
        // If minimized, restore it
        if (windowEl.hasClass('minimized')) {
            restoreWindow(windowId);
            return;
        }
        
        // Define better window positions that don't overlap with the sidebar
        const positions = {
            'about': { left: 250, top: 50 },
            'experience': { left: 280, top: 80 },
            'projects': { left: 310, top: 110 },
            'skills': { left: 340, top: 140 },
            'resume': { left: 370, top: 170 },
            'papers': { left: 400, top: 200 }
        };
        
        // Get viewport dimensions
        const viewportWidth = $(window).width();
        const viewportHeight = $(window).height() - 40; // Subtract taskbar height
        
        // Get the position for this window, or use a default
        const position = positions[sectionName] || { left: 250, top: 100 };
        
        // Ensure the window is visible on screen
        let finalLeft = position.left;
        let finalTop = position.top;
        
        // Get window dimensions or use defaults
        const windowWidth = windowEl.width() || 400;
        const windowHeight = windowEl.height() || 300;
        
        // Make sure window is within viewport
        if (finalLeft + windowWidth > viewportWidth) {
            finalLeft = Math.max(0, viewportWidth - windowWidth - 20);
        }
        
        if (finalTop + windowHeight > viewportHeight) {
            finalTop = Math.max(0, viewportHeight - windowHeight - 20);
        }
        
        // Ensure windows use absolute positioning to not affect other elements
        windowEl.css({
            'position': 'absolute',
            'left': finalLeft + 'px',
            'top': finalTop + 'px',
            'display': 'block' // Ensure it's visible
        });
        
        // Store the position
        windowPositions[windowId] = {
            top: finalTop + 'px',
            left: finalLeft + 'px'
        };
        
        // Add to taskbar
        addToTaskbar(windowId, windowEl.find('.window-title-text').text());
        
        // Bring to front
        makeWindowActive(windowId);
    }
    
    // Handle clicks on taskbar buttons
    $(document).on('click', '.taskbar-button', function() {
        const windowId = $(this).data('window');
        
        // If window doesn't exist, remove the button
        if (!$('#' + windowId).length) {
            $(this).remove();
            return;
        }
        
        // If window is visible and not minimized, minimize it
        if ($('#' + windowId).is(':visible') && !$('#' + windowId).hasClass('minimized')) {
            minimizeWindow(windowId);
        } else {
            // If minimized or hidden, restore/show it
            restoreWindow(windowId);
        }
    });
    
    // Start button menu
    $('.start-button').on('click', function() {
        if ($('.start-menu').length) {
            $('.start-menu').remove();
        } else {
            const startMenu = $(`
                <div class="start-menu">
                    <div class="start-menu-header">
                        <div class="start-menu-title">Mehdi Mihir</div>
                    </div>
                    <div class="start-menu-items">
                        <div class="start-menu-item" data-section="about">About & Contact</div>
                        <div class="start-menu-item" data-section="experience">Experience</div>
                        <div class="start-menu-item" data-section="projects">Projects</div>
                        <div class="start-menu-item" data-section="skills">Skills</div>
                        <div class="start-menu-item" data-section="resume">Resume</div>
                        <div class="start-menu-item" data-section="papers">Papers</div>
                        <div class="start-menu-separator"></div>
                        <div class="start-menu-item" id="start-shutdown">Shutdown</div>
                    </div>
                </div>
            `);
            
            $('body').append(startMenu);
            
            $('.start-menu-item').on('click', function() {
                if ($(this).attr('id') === 'start-shutdown') {
                    $('body').addClass('shutdown');
                    setTimeout(() => {
                        $('body').append('<div class="shutdown-screen"><div>It is now safe to turn off your computer.</div></div>');
                        setTimeout(() => {
                            $('.shutdown-screen').fadeOut(1000, function() {
                                $(this).remove();
                                $('body').removeClass('shutdown');
                            });
                        }, 3000);
                    }, 500);
                } else {
                    const section = $(this).data('section');
                    openWindow(section);
                }
                $('.start-menu').remove();
            });
            
            $(document).on('click', function(e) {
                if (!$(e.target).closest('.start-button, .start-menu').length) {
                    $('.start-menu').remove();
                }
            });
        }
    });
    
    // Create desktop icons function
    function createDesktopIcons() {
        const iconData = [
            { name: 'Visual Studio', icon: 'visual-studio.png' },
            { name: 'VS Code', icon: 'vscode.png' },
            { name: 'Jupyter Notebook', icon: 'jupyter.png' },
            { name: 'Docker', icon: 'docker.png' },
            { name: 'AWS', icon: 'aws.png' },
            { name: 'GitHub', icon: 'github.png' },
            { name: 'Jira', icon: 'jira.png' }
        ];
        
        // Create desktop icons container if it doesn't exist
        if ($('.desktop-icons').length === 0) {
            $('body').append('<div class="desktop-icons"></div>');
        }
        
        // Add each icon to the container
        iconData.forEach((icon, index) => {
            $('.desktop-icons').append(`
                <div class="desktop-icon" style="top: ${50 + index * 100}px;">
                    <img src="icons/${icon.icon}" alt="${icon.name}">
                    <div class="icon-text">${icon.name}</div>
                </div>
            `);
        });
        
        // Style desktop icons container
        $('.desktop-icons').css({
            'position': 'fixed',
            'right': '20px',
            'top': '0',
            'z-index': '1'
        });
        
        // Style individual icons
        $('.desktop-icon').css({
            'display': 'flex',
            'flex-direction': 'column',
            'align-items': 'center',
            'position': 'absolute',
            'right': '0',
            'width': '80px',
            'text-align': 'center',
            'cursor': 'pointer'
        });
        
        // Style icon images
        $('.desktop-icon img').css({
            'width': '48px',
            'height': '48px',
            'margin-bottom': '5px'
        });
        
        // Style icon text
        $('.desktop-icon .icon-text').css({
            'color': 'white',
            'text-shadow': '1px 1px 2px black',
            'font-size': '12px',
            'word-wrap': 'break-word',
            'max-width': '80px'
        });
        
        // Handle icon clicks (for demonstration)
        $('.desktop-icon').on('click', function() {
            const iconName = $(this).find('.icon-text').text();
            alert(`I also use ${iconName} when developing!`);
        });
    }
    
    // Cursor trail effect
    $(document).on('mousemove', function(e) {
        createCursorTrail(e.pageX, e.pageY);
    });
    
    function createCursorTrail(x, y) {
        const trail = $('<div class="cursor-trail"></div>');
        trail.css({
            left: x + 'px',
            top: y + 'px'
        });
        
        $('body').append(trail);
        
        // Remove the trail element after animation completes
        setTimeout(() => {
            trail.remove();
        }, 1000);
    }
    
    // Create content for all sections
    createAboutWindow();
    createExperienceWindow();
    createProjectsWindow();
    createSkillsWindow();
    createResumeWindow();
    createPapersWindow();
    
    // Initially show only about window and clear taskbar
    $('.window').hide();
    $('.taskbar-buttons').empty(); // Clear taskbar initially
    
    // Open about window by default
    openWindow('about');
});

// Helper function to create window elements
function createWindowElement(id, title, left, top) {
    const windowElement = $(`
        <div id="${id}-window" class="window" style="position: absolute; left: ${left}px; top: ${top}px;">
            <div class="window-title">
                <div class="window-title-text">${title}</div>
                <div class="window-controls">
                    <div class="window-button window-minimize">_</div>
                    <div class="window-button window-close">✕</div>
                </div>
            </div>
            <div class="window-content"></div>
        </div>
    `);
    
    // Make the window draggable immediately after creation
    windowElement.draggable({
        handle: '.window-title',
        containment: 'body',
        start: function() {
            // Bring the window to the front when dragging
            $('.window').css('z-index', 1);
            $(this).css('z-index', 2);
            // Add dragging class for cursor change
            $(this).addClass('dragging-window');
        },
        stop: function() {
            // Remove dragging class when done
            $(this).removeClass('dragging-window');
        }
    });
    
    return windowElement;
}

// Functions to create each window
function createAboutWindow() {
    const aboutWindow = createWindowElement('about', 'about & contact', 250, 50);
    
    const content = `
        <h2>hello world!</h2>
        <p>welcome to my website portfolio. my name is Mehdi, a recent graduate from 
        Southern New Hampshire University with a Bachelor of Science in Computer, 
        residing in Liverpool, NY.</p>
        
        <img src="assets/profile-picture.jpg" alt="Mehdi Mihir" class="profile-pic">
        
        <p>please feel free to contact me for any questions/inquiries!</p>
        <div class="contact-links">
            <p><strong>github:</strong> <a href="https://github.com/mehdimihir" target="_blank">mehdmihir</a></p>
            <p><strong>linkedin:</strong> <a href="https://linkedin.com/in/mmihir" target="_blank">mmihir</a></p>
            <p><strong>email:</strong> <a href="mailto:mehdi.mihir@gmail.com">mehdi.mihir@gmail.com</a></p>
        </div>
    `;
    
    aboutWindow.find('.window-content').html(content);
    $('main').append(aboutWindow);
}

function createExperienceWindow() {
    const expWindow = createWindowElement('experience', 'technical experience', 280, 80);
    
    const content = `
        <div class="experience-item">
            <h3>NYC Department of Transportation</h3>
            <p class="exp-role">Data Science Engineering Intern | Pavement Profile Project</p>
            <p class="exp-date">Jun. 2023 – Aug. 2023</p>
            <ul>
                <li>Worked with city planners and civil engineers to digitize roadway deterioration modeling using Geographic Information Systems (GIS)</li>
                <li>Streamlined metadata organization and conducted advanced dataset querying</li>
                <li>Engineered dynamic maps and interactive dashboards using D3.js</li>
            </ul>
        </div>

        <div class="experience-item">
            <h3>Bank of America</h3>
            <p class="exp-role">Software Engineering Intern</p>
            <p class="exp-date">Jun. 2022 – Aug. 2022</p>
            <ul>
                <li>Developed and deployed predictive models using Python, TensorFlow, and Scikit-Learn</li>
                <li>Implemented AES encryption using PyCryptodome and RSA encryption</li>
                <li>Collaborated with the cloud engineering team to migrate legacy systems to AWS</li>
                <li>Developed user interfaces for internal tools using React.js and Redux</li>
            </ul>
        </div>

        <div class="experience-item">
            <h3>Openwave Computing</h3>
            <p class="exp-role">Software Engineering Intern | QuikAllot – Field Service Management Software</p>
            <p class="exp-date">Jun. 2021 – Aug. 2021</p>
            <ul>
                <li>Designed and developed mobile UI screens using Figma</li>
                <li>Implemented client-side features using React.js, Redux, and Axios</li>
                <li>Developed employer-side solutions including real-time GIS tracking</li>
                <li>Designed database architecture in AWS RDS and built RESTful APIs</li>
            </ul>
        </div>

        <div class="experience-item">
            <h3>Stony Brook University</h3>
            <p class="exp-role">Undergraduate Teaching Assistant</p>
            <p class="exp-date">Sep. 2020 – Jun. 2022</p>
            <ul>
                <li>Mentored over 50 students individually and evaluated assignments</li>
                <li>Created supplemental lecture materials with Google Colab Notebooks</li>
            </ul>
        </div>
    `;
    
    expWindow.find('.window-content').html(content);
    $('main').append(expWindow);
}

function createProjectsWindow() {
    const projectsWindow = createWindowElement('projects', 'projects', 310, 110);
    
    // Made project titles into clickable links that open in new tabs
    const content = `
        <div class="project-card">
            <div class="project-title">
                <a href="https://github.com/mehd-mihir/fitness-tracker" target="_blank">🏋🏽 Fitness Tracker Dashboard</a>
            </div>
            <p>Java, JavaFX, Chart.js, Google Maps API, Firebase</p>
            <ul>
                <li>Developed a desktop application to enable users to log workouts and track progress</li>
                <li>Implemented data visualization using Chart.js</li>
                <li>Utilized TensorFlow Java API for predictive analytics</li>
                <li>Integrated Firebase for real-time database and authentication</li>
            </ul>
        </div>

        <div class="project-card">
            <div class="project-title">
                <a href="https://github.com/mehd-mihir/finance-management-app" target="_blank">💸 Personal Finance Management App</a>
            </div>
            <p>React Native, Node.js, AWS (DynamoDB, Lambda, S3)</p>
            <ul>
                <li>Developed a mobile app to track expenses, set budgets, and achieve financial goals.</li>
                <li>Engineered with React Native for cross-platform use; integrated AWS DynamoDB.</li>
                <li>Utilized AWS Lambda for serverless functions and AWS S3 for secure media storage.</li>
            </ul>
        </div>

        <div class="project-card">
            <div class="project-title">
                <a href="https://github.com/mehdimihir/CS-370-Deep-Q-Learning-Agent" target="_blank">🕵️ Treasure Hunt Game: Deep Q-Learning Agent</a>
            </div>
            <p>Python, TensorFlow/Keras, NumPy, Matplotlib, Jupyter Notebook</p>
            <ul>
                <li>Implemented a reinforcement learning project with an intelligent pirate agent that navigates a maze using deep Q-learning.</li>
                <li>Designed neural network architecture for decision-making in an 8×8 maze.</li>
                <li>Utilized experience replay mechanism for stable learning and improved performance.</li>
                <li>Applied epsilon-greedy exploration strategy to balance exploration and exploitation.</li>
                <li>Developed and fine-tuned reward system to incentivize efficient navigation.</li>
            </ul>
        </div>

        <div class="project-card">
            <div class="project-title">
                <a href="https://github.com/mehdimihir/CS-330-Zen-Garden-OpenGL" target="_blank">⛩️ Zen Garden Visualization in OpenGL</a>
            </div>
            <p>OpenGL, GLEW, GLM, GLFW</p>
            <ul>
                <li>Developed a 3D visualization project featuring an interactive Zen garden scene with textured objects and dynamic lighting.</li>
                <li>Implemented a textured container, wooden bridge, and decorative ornaments using various primitives and composite shapes.</li>
                <li>Created an interactive camera system with WASD movement and mouse controls.</li>
                <li>Enabled toggling between perspective and orthographic views for flexible visualization.</li>
            </ul>
        </div>

        <!-- Extra Projects -->

        <!-- <div class="project-card">
            <div class="project-title">Draw It or Lose It</div>
            <p>HTML, CSS, JavaScript, Node.js, Express, MongoDB, WebSocket, SSL/TLS, JWT, OAuth</p>
            <ul>
                <li>Developed a multi-user game application for The Gaming Room client.</li>
                <li>Implemented secure communication between platforms using SSL/TLS, WebSocket, and JWT.</li>
                <li>Analyzed and provided recommendations on operating platforms, architectures, storage, memory management, and security.</li>
                <li>Collaborated effectively through structured design documentation.</li>
            </ul>
        </div> -->

        <!-- <div class="project-card">
            <div class="project-title">Travlr Getaways - Travel Booking App</div>
            <p>HTML, CSS, JavaScript, Node.js, Express, Angular, MongoDB</p>
            <ul>
                <li>Implemented server-side rendering with Express HTML and Handlebars templates for initial views.</li>
                <li>Enhanced client-side interactivity with JavaScript and DOM manipulation.</li>
                <li>Created a Single-Page Application (SPA) using Angular for dynamic content updates.</li>
                <li>Utilized MongoDB for flexible schema design, JSON-like document model, and excellent performance.</li>
                <li>Refactored code with reusable components, centralized security management, and modular API endpoints.</li>
                <li>Implemented JWT token authentication, request validation middleware, and role-based access control.</li>
                <li>Conducted API testing with Postman and debugging using browser dev tools.</li>
            </ul>
        </div> -->
        
        <!-- Add more projects when I want -->
    `;
    
    projectsWindow.find('.window-content').html(content);
    $('main').append(projectsWindow);
}

function createSkillsWindow() {
    const skillsWindow = createWindowElement('skills', 'technical skills', 340, 140);
    
    const content = `
        <div class="skill-category">
            <div class="skill-title">Languages</div>
            <div class="skill-list">
                <div class="skill-item">Python</div>
                <div class="skill-item">Java</div>
                <div class="skill-item">C++</div>
                <div class="skill-item">JavaScript</div>
                <div class="skill-item">TypeScript</div>
                <div class="skill-item">SQL</div>
                <div class="skill-item">Swift</div>
            </div>
        </div>
        
        <div class="skill-category">
            <div class="skill-title">Technologies & Frameworks</div>
            <div class="skill-list">
                <div class="skill-item">AWS</div>
                <div class="skill-item">Linux</div>
                <div class="skill-item">DynamoDB</div>
                <div class="skill-item">Firebase</div>
                <div class="skill-item">PostGres</div>
                <div class="skill-item">GCP</div>
                <div class="skill-item">React</div>
                <div class="skill-item">MongoDB</div>
                <div class="skill-item">Express</div>
                <div class="skill-item">Angular</div>
                <div class="skill-item">Node.js</div>
                <div class="skill-item">jQuery</div>
                <div class="skill-item">Git</div>
                <div class="skill-item">Docker</div>
                <div class="skill-item">Kubernetes</div>
                <div class="skill-item">Jenkins</div>
                <div class="skill-item">PyTorch</div>
                <div class="skill-item">TensorFlow</div>
            </div>
        </div>
    `;
    
    skillsWindow.find('.window-content').html(content);
    $('main').append(skillsWindow);
}

function createResumeWindow() {
    const resumeWindow = createWindowElement('resume', 'resume', 370, 170);
    
    const content = `
        <p>you can download my resume as a PDF:</p>
        <button id="download-resume" class="retro-button">Download Resume</button>
        
        <div class="resume-preview">
            <h3>Mehdi Mihir</h3>
            <p>(347) 247 1655 | mehdi.mihir@gmail.com | <a href="https://linkedin.com/in/mmihir" target="_blank">LinkedIn</a> | <a href="https://github.com/mehd-mihir" target="_blank">GitHub</a></p>
            <br>
            <h4>Education</h4>
            <p>Southern New Hampshire University, BS in Computer Science (Honors)</p>
            <p>Sep. 2022 – April 2025</p>
            <br>
            <p>Stony Brook University, BS in Computer Science</p>
            <p>Sep. 2020 – June 2022</p>
            
            <!-- Resume preview content continues here -->
        </div>
    `;
    
    resumeWindow.find('.window-content').html(content);
    $('main').append(resumeWindow);
    
    // Add download functionality
    $(document).on('click', '#download-resume', function() {
        // Resume PDF for download
        window.open('assets/Mehdi-Mihir-SWE-Resume.pdf', '_blank');
    });
}

function createPapersWindow() {
    const papersWindow = createWindowElement('papers', 'academic papers', 400, 200);
    
    const content = `
        <div class="papers-intro">
            <p>here are some of my academic papers and research projects.</p>
        </div>

        <div class="paper-item">
            <h3>Digital Wellness Technologies and Mental Health</h3>
            <p class="paper-date">Winter 2025</p>
            <p class="paper-description">
                This paper shows that while Generation Z widely adopts digital wellness tools, their impact on mental health is paradoxical
                — these technologies often fall short of delivering lasting benefits and can even contribute to anxiety and digital fatigue.
            </p>
            <div class="paper-tags">
                <span class="paper-tag">Digital Wellness</span>
                <span class="paper-tag">Generation Z</span>
                <span class="paper-tag">Mental Health</span>
                <span class="paper-tag">Digital Fatigue</span>
            </div>
            <a href="assets/Digital-Wellness-Technologies-Mental-Health.pdf" target="_blank" class="retro-button paper-view-btn">View Paper</a>
        </div>
        
        <div class="paper-item">
            <h3>Cloud-based Microservice Architecture: Benefits and Challenges</h3>
            <p class="paper-date">Spring 2023</p>
            <p class="paper-description">
                An exploration of microservice architectures in cloud environments, discussing the advantages,
                challenges, and best practices for implementation.
            </p>
            <div class="paper-tags">
                <span class="paper-tag">Cloud Computing</span>
                <span class="paper-tag">Microservices</span>
                <span class="paper-tag">DevOps</span>
            </div>
            <a href="assets/Cloud-Microservice-Paper.pdf" target="_blank" class="retro-button paper-view-btn">View Paper</a>
        </div>

        <!--
        <div class="paper-item">
            <h3>Machine Learning Approaches to Network Intrusion Detection</h3>
            <p class="paper-date">Spring 2024</p>
            <p class="paper-description">
                This paper explores various machine learning techniques for detecting network intrusions,
                comparing the effectiveness of supervised and unsupervised learning methods on common datasets.
            </p>
            <div class="paper-tags">
                <span class="paper-tag">Cybersecurity</span>
                <span class="paper-tag">Machine Learning</span>
                <span class="paper-tag">Network Security</span>
            </div>
            <a href="assets/ml-network-intrusion.pdf" target="_blank" class="retro-button paper-view-btn">View Paper</a>
        </div> -->
    `;
    
    papersWindow.find('.window-content').html(content);
    $('main').append(papersWindow);
    
    // REMOVED: Paper view functionality that creates modals
    // Instead, the links now directly point to PDF files for download
}