import React from 'react';
import './SessionRemainderPopUp.css';

const SessionRemainderPopUp = ({handleSession}) => {
  return (
    <div className="session_popup_div" id="sessionPopUpDiv">
                <div className="session_popup_modal" id="sessionPopUpModal">
                    <div className="session_header" id="sessionHeader">
                        <span className="session_header_text" id="sessionHeaderText">Session Reminder</span>
                    </div>
                    <div className="session_body" id="sessionBody">
                        <span className="session_body_text" id="sessionBodyText">Your session will be expired within few
                            seconds.</span>
                        <span className="session_body_text" id="sessionBodyText">Please save your work.</span>
                    </div>
                    <div className="session_button_div" id="sessionButtonDiv">
                        <button className="session_button" id="sessionButton" onClick={handleSession}>OK</button>
                    </div>
                </div>
            </div>
  )
}

export default SessionRemainderPopUp