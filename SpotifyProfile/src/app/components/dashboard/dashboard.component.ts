import { Component, OnInit, Input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl, SafeUrl} from '@angular/platform-browser';
import axios from 'axios';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.sass']
})

export class DashboardComponent implements OnInit {
  
  constructor(private sanitizer: DomSanitizer) {}

  code = new URLSearchParams(window.location.search).get('code');
  accessToken = "";
  isDataAvailable: boolean = false;

  user:any = {
    searchArr: [],
    user_name: "",
    user_photo_url: "",
    favSongs: [],
    playlists: [],
    mostListenedToSong: {
      songTilte: "",
      albumCoverUrl: ""
    }
  }

  ngOnInit() {
    this.getNewAccess();//grabs new access code needed after reload
    
    //code from initial api request
    if(this.code){  
      //(spotify requries body to be sent application/x-www-form-urlencoded * axios sends data by default as JSON)
      const encodedParams = new URLSearchParams();
      encodedParams.append('grant_type', 'authorization_code');
      encodedParams.append('code', this.code);
      encodedParams.append('redirect_uri', 'http://localhost:4200/dashboard');

      axios.post('https://accounts.spotify.com/api/token', encodedParams ,
        {
          headers: {
            //Auth format = Authorization: Basic *<base64 encoded client_id:client_secret>*
            Authorization: 'Basic NTNlMjY3OWU2M2NjNGNhZTlmNmIyNGI4MDEzZmQxNWY6YjZhODljNjM0NGI5NGU3NGIwMGJiMzMzN2U3NmM4NTI'
          }
        }
      )
      .then( (response: any) => {
        if(response.status == 200){
           //send GET request to /v1/me endpoint to get user data w/ access token
          this.accessToken = response.data.access_token;
          axios.get('https://api.spotify.com/v1/me', {
              headers: {
                Authorization: `Bearer ${this.accessToken}`
              }
            }
          ).then( (response: any) => {
              //assigns values from the response to the user object 
              let user2 = {
                user_name: "",
                user_photo_url: ""
              }
              this.user.user_name = response.data.display_name;
              this.user.user_photo_url = response.data?.images[0].url;
              this.isDataAvailable = true;
              this.getRecentLikedSongs();
              this.getMostListenedToSong();
              this.getPlaylistData();

              //testing
              // console.log(JSON.stringify(this.user));
              // console.log(response);
          })
        }
      })
      .catch(function (error: any) {
        console.log(error);
      });
    }else{
      console.log("Missing access code!!");
      this.getNewAccess();
    }
  }



  getNewAccess(){ 
    //check for Navigation Timing API support
    if (window.performance) {
      console.info("window.performance works fine on this browser");
    }
    if (performance.navigation.type == performance.navigation.TYPE_RELOAD) {
      console.info( "This page is reloaded" );
      document.location.href = "https://accounts.spotify.com/authorize?client_id=53e2679e63cc4cae9f6b24b8013fd15f&response_type=code&redirect_uri=http://localhost:4200%2Fdashboard&scope=user-top-read%20streaming%20user-read-email%20user-read-private%20user-library-read%20user-library-modify%20user-read-playback-state%20user-modify-playback-state";
    } 
  }

  getRecentLikedSongs() {
    console.log("Getting recently liked songs.....")
    axios({
      method: 'get',
      url: 'https://api.spotify.com/v1/me/tracks?limit=10',
      headers: {
        Authorization: `Bearer ${this.accessToken}`
      }
    })  
    .then( (response: any) => {
      this.user.favSongs = response.data.items;
    });
  }

  getMostListenedToSong(){
    console.log("Getting most listened to song of the year.....")
    axios({
      method: 'get',
      url: "https://api.spotify.com/v1/me/top/tracks?time_range=long_term&limit=1",
      headers: {
        Authorization: `Bearer ${this.accessToken}`
      }
    })  
    .then( (response: any) => {
      this.user.mostListenedToSong.songTitle = response.data.items[0].name;
      this.user.mostListenedToSong.albumCoverUrl = response.data.items[0].album.images[0].url;
      this.user.mostListenedToSong.songArtistName = response.data.items[0].artists[0].name;
      console.log(response.data.items);
      console.log(this.user.mostListenedToSong.albumCoverUrl);
    });
  }


  getPlaylistData(){
    console.log("Getting users playlist data.....")
    axios({
      method: 'get',
      url: 'https://api.spotify.com/v1/me/playlists?limit5',
      headers: {
        Authorization: `Bearer ${this.accessToken}`
      }
    })  
    .then( (response: any) => {
      this.user.playlists = response.data.items;
      console.log(this.user.playlists);
    });
  }

  
  searchActive(value: any){
    if(value.data === null){
      this.user.searchArr.pop();
    }else{
      this.user.searchArr.push(value.data)
    }

    let searchString = this.user.searchArr.join('');
    this.search(searchString);
  }

  search(searchString: string){
    //don't call endpoint if the search array is empty
    if(this.user.searchArr.length == 0)
    {
      console.log("Search field is empty. Not performing search.")
    }
    else
    {
      console.log("Searching.....")
      axios({
        method: 'get',
        url: `https://api.spotify.com/v1/search?q=${searchString}&type=artist,track,album`,
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      })  
      .then( (response: any) => {
        console.log(response.data);
      });
    }
  }

  infoIconShow(){
    console.log("info icon should show now..");
  }
}
