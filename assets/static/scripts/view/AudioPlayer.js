/*
Copyright 2019 VoxForge

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

/**
* setup app settings Popup for user to modify
*/
function AudioPlayer (
    movePrompt2Stack,
    pageVariables,)
{
    this.movePrompt2Stack = movePrompt2Stack;

    var a = pageVariables.alert_message;
    this.no_speech = a.no_speech,      
    this.no_speech_autogain = a.no_speech_autogain,
    this.no_trailing_silence = a.no_trailing_silence,
    this.audio_too_soft = a.audio_too_soft,
    this.audio_too_soft_autogain = a.audio_too_soft_autogain,    
    this.audio_too_loud = a.audio_too_loud,
    this.audio_too_loud_autogain = a.audio_too_loud_autogain,

    this.playbuttontext = pageVariables.playbuttontext;
    this.stopbuttontext = pageVariables.stopbuttontext;

    // where audio files will be displayed in HTML
    this.soundClips = document.querySelector('.sound-clips');
    // unique id for wavesurfer objects in DOM
    this.clip_id = 0;    
}

/**
* run after worker completes audio recording; creates a waveform display of 
* recorded audio and displays text of associated prompt line.  User can
* then review and if needed delete an erroneous recording, which can then be
* re-recorded
*/
AudioPlayer.prototype.display = function (obj) 
{
    var self = this;
    
    //var prompt_id = obj.prompt_id; // TODO not used yet...
    var blob = obj.blob;


    var audioURL = window.URL.createObjectURL(blob);
    var prompt_id = document.querySelector('.prompt_id').innerText;
    var waveformdisplay_id = "waveformContainer_" + prompt_id;
    
    var clipContainer =
        self._setUpClipContainer.call(
            self,
            obj,
            audioURL,
            prompt_id,
            waveformdisplay_id);

    self.soundClips.insertBefore(
        clipContainer,
        self.soundClips.children[0]);
        
    // #########################################################################
    return new Promise(function (resolve, reject) {
        // might be able to simplify this with: https://github.com/cwilso/Audio-Buffer-Draw
        // add waveform to waveformElement
        // see http://wavesurfer-js.org/docs/
        //if (self.displayWaveform) {
        if ( self.waveformDisplayChecked() ) {        
            wavesurfer[self.clip_id] = WaveSurfer.create({
              container: '#' + waveformdisplay_id,
              scrollParent: true,
              waveColor : 'OliveDrab',
              minPxPerSec: 200,
            });
            wavesurfer[self.clip_id].load(audioURL);

            wavesurfer[self.clip_id].on('ready', function () {
              resolve(obj); // return value on completion
            });
        } else {
            resolve(obj); // return value on completion
        }
        self.clip_id++;

    });//promise
}

AudioPlayer.prototype._setUpClipContainer = function (
    obj,
    audioURL,
    prompt_id,
    waveformdisplay_id)
{
    var clipContainer = document.createElement('article');
    clipContainer.classList.add('clip');
    
    clipContainer.appendChild(this._createClipLabel());
    clipContainer.appendChild(this._createDeleteButton());

    if ( this.waveformDisplayChecked() ) {        
      clipContainer.appendChild(
        this._createWaveformElement(
            obj,
            waveformdisplay_id,
            prompt_id));
    } else {
      clipContainer.appendChild(this._createAudioPlayer(audioURL));
    }
    clipContainer.appendChild(this._createAudioContainer(audioURL));

    return clipContainer;
}

/**
* displays the speech recording's transcription
*/
AudioPlayer.prototype._createClipLabel = function () {
    var prompt_id = document.querySelector('.prompt_id').innerText;    
    var prompt_sentence = document.querySelector('.info-display').innerText;
    
    var clipLabel = document.createElement('prompt');
    clipLabel.classList.add('clip-label');
    clipLabel.textContent = prompt_id + " " + prompt_sentence;

    return clipLabel;
}

/**
* create button to allow user to delete a prompt line
*/
AudioPlayer.prototype._createDeleteButton = function () {
    var deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'delete';

    //deleteButton.disabled = 'true';

    /**
    * delete a recorded prompt; which is then saved in prompt_stack so user
    * can re-record
    */
    deleteButton.onclick = function(e) {
        var evtTgt = e.target;
        var prompt_id = evtTgt.parentNode.innerText.split(/(\s+)/).shift();

        self.movePrompt2Stack(evtTgt.parentNode.firstChild.innerText);
        evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
        console.log("prompt deleted: " + prompt_id);

        $('#delete_clicked').click();
    }

    return deleteButton;
}

/**
* create easier to access audio links in DOM
* TODO need to figure out how to get audio links from Wavesurfer...
* TODO Firefox records audio in 32-bit float, but cannot play it back....
* this could be used to store 32bit float audio in Firefox, while
* 16bit wav could be sent to WaveSurfer
*/
AudioPlayer.prototype._createAudioContainer = function (audioURL) {
    var audioPlayer = document.createElement('audio');
    audioPlayer.src = audioURL;

    return audioPlayer;
}

AudioPlayer.prototype._createAudioPlayer = function (audioURL) {
    var audioPlayer = document.createElement('audio');
    audioPlayer.classList.add('audio_player');
    audioPlayer.setAttribute('controls', '');
    audioPlayer.controls = true;
    audioPlayer.src = audioURL;
    console.log(prompt_id + " recorder stopped; audio: " + audioURL);

    return audioPlayer;
}

/**
* this creates the container (i.e. element in the shadow DOM) to be used
* by WaveSurfer to display the audio waveform; Wavesurfer needs the container 
* to exist before being called, so this creates the it...
*/
AudioPlayer.prototype._createWaveformElement = function (
    obj,
    waveformdisplay_id,
    prompt_id)
{    
    var self = this;

    var waveformElement = document.createElement('div');
    // hook for wavesurfer
    waveformElement.setAttribute("id", waveformdisplay_id);
    // TODO move this to css
    waveformElement.setAttribute("style", 
        "border-style: solid; min-width:100px; ");
    var style = document.createElement('div');
    style.setAttribute("style", "text-align: center");

    if (obj.no_speech) {
        waveformElement.setAttribute("style", "background: #ff4500");
        var no_speech_message = obj.app_auto_gain ?
            self.no_speech_autogain :
            self.no_speech;
        waveformElement.innerHTML = "<h4>" + no_speech_message + "</h4>";
    } else if (obj.no_trailing_silence) {
        waveformElement.setAttribute("style", "background: #ffA500");
        waveformElement.innerHTML = "<h4>" + self.no_trailing_silence + "</h4>";
    //TODO need confidence level for clipping
    } else if (obj.clipping) {
        // TODO should not be able to upload if too loud
        waveformElement.setAttribute("style", "background: #ff4500");
        var audio_too_loud_message = obj.app_auto_gain ?
            self.audio_too_loud_autogain :
            self.audio_too_loud;
        waveformElement.innerHTML = "<h4>" + audio_too_loud_message + "</h4>";
    //TODO need confidence level for soft speaker
    } else if (obj.too_soft) {
        waveformElement.setAttribute("style", "background: #ff4500");
        var audio_too_soft_message = obj.app_auto_gain ?
            self.audio_too_soft_autogain :
            self.audio_too_soft;
        waveformElement.innerHTML = "<h4>" + audio_too_soft_message + "</h4>";
    }

    // playbutton inside wavesurfer display
    var display_id = "button_" + prompt_id;
    var button = document.createElement(display_id);
    button.className = "play btn btn-primary";
    // TODO not sure how to toggle Play/Pause text
    button.textContent = self.playbuttontext; 
    button.setAttribute("onclick", "wavesurfer[" + self.clip_id + "].playPause()");

    style.appendChild(button);
    waveformElement.appendChild(style);

    console.log("clip_id: " + self.clip_id);

    return waveformElement;
}

AudioPlayer.prototype.reset = function () 
{
    this.clip_id = 0;
    this.clearSoundClips();    
}

/**
* clear sound clips
*/
AudioPlayer.prototype.clearSoundClips = function () {
    $( '.sound-clips' ).empty();
}

/**
* 
*/
AudioPlayer.prototype.waveformDisplayChecked = function () {
    return $('#waveform_display').is(":checked");  
}
