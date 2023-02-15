import axios from "axios";
import DOMPurify from "dompurify";

export default class Search {
  //1.select DOM elements and keep track of any useful data
  constructor() {
    this._csrf = document.querySelector("[name='_csrf']").value;

    this.injectHTML();
    this.headerSearchIcon = document.querySelector(".header-search-icon");
    this.overlay = document.querySelector(".search-overlay");
    this.closedIcon = document.querySelector(".close-live-search");
    this.inputField = document.querySelector("#live-search-field");

    this.resultsArea = document.querySelector(".live-search-results");
    this.loaderIcon = document.querySelector(".circle-loader");

    this.typingWaitTimer;
    this.previousValue = "";
    this.events(); //beginning listening or running as soon as the object is created.
  }

  //2.Events
  events() {
    //when user start to type, spin the loader icon
    this.inputField.addEventListener("keyup", () => this.keyPressHandler());

    //when user click closed icon
    this.closedIcon.addEventListener("click", () => this.closeOverlay());

    //when user click header search icon
    this.headerSearchIcon.addEventListener("click", e => {
      e.preventDefault();
      this.openOverlay();
    });
  }

  //3.Methods
  keyPressHandler() {
    let value = this.inputField.value;
    //if someone performs a search and then empties out the text field entirely
    if (value == "") {
      clearTimeout(this.typingWaitTimer);
      this.hideLoaderIcon();
      this.hideResultsArea();
    }
    //starting to search
    if (value != "" && value != this.previousValue) {
      clearTimeout(this.typingWaitTimer);
      this.showLoaderIcon();
      this.hideResultsArea();
      this.typingWaitTimer = setTimeout(() => this.sendRequest(), 750);
    }

    this.previousValue = value;
  }
  //send off asynchronous request to our server using Axios library
  //in the backend: setup a route in our Express app to matches this post request
  sendRequest() {
    axios
      .post("/search", { searchTerm: this.inputField.value, _csrf: this._csrf })
      .then(response => {
        //response is a server response with JSON data
        console.log(response.data);
        this.renderResultHTML(response.data);
      })
      .catch(() => {
        alert("hello, the request fails.");
      });
  }

  renderResultHTML(posts) {
    if (posts.length) {
      this.resultsArea.innerHTML = DOMPurify.sanitize(`
        <div class="list-group shadow-sm">
            <div class="list-group-item active"><strong>Search Results</strong> (${posts.length > 1 ? `${posts.length} items found` : `1 item found`})</div>

            ${posts
              .map(post => {
                let postDate = new Date(post.createdDate);
                return `
                <a href="/post/${post._id}" class="list-group-item list-group-item-action">
                  <img class="avatar-tiny" src="${post.author.avatar}"> <strong>${post.title}</strong>
                  <span class="text-muted small">by ${post.author.username} on ${postDate.getMonth() + 1}/${postDate.getDate()}/${postDate.getFullYear()}</span>
                </a>
              `;
              })
              .join("")}
              
        </div>

      `);
    } else {
      this.resultsArea.innerHTML = `
        <p class="alert alert-danger text-center shadow-sm ">Sorry, We could not find any results.</p>
      `;
    }
    this.hideLoaderIcon();
    this.showResultsArea();
  }

  showLoaderIcon() {
    this.loaderIcon.classList.add("circle-loader--visible");
  }
  hideLoaderIcon() {
    this.loaderIcon.classList.remove("circle-loader--visible");
  }

  showResultsArea() {
    this.resultsArea.classList.add("live-search-results--visible");
  }
  hideResultsArea() {
    this.resultsArea.classList.remove("live-search-results--visible");
  }

  openOverlay() {
    //show full screen overlay
    this.overlay.classList.add("search-overlay--visible");
    setTimeout(() => this.inputField.focus(), 50);
  }

  closeOverlay() {
    this.overlay.classList.remove("search-overlay--visible");
  }
  //Overlay template
  injectHTML() {
    document.body.insertAdjacentHTML(
      "beforeend",
      `
  <div class="search-overlay">
    <div class="search-overlay-top shadow-sm">
      <div class="container container--narrow">
        <label for="live-search-field" class="search-overlay-icon"><i class="fas fa-search"></i></label>
        <input type="text" id="live-search-field" class="live-search-field" placeholder="What are you interested in?">
        <span class="close-live-search"><i class="fas fa-times-circle"></i></span>
      </div>
    </div>

    <div class="search-overlay-bottom">
      <div class="container container--narrow py-3">
        <div class="circle-loader"></div>
          <div class="live-search-results"></div>
        </div>
      </div>
    </div>

  </div>
    `
    );
  }
}
