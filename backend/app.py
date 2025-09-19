import os.path
import base64
import re
import json
import time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import google.generativeai as genai

# If modifying these scopes, delete the file token.json.
GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.modify']
CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar.events']

# Canonical app paths and timezone
BASE_DIR = os.path.dirname(__file__)
TIMEZONE = 'Europe/Helsinki'
LOCAL_TZ = ZoneInfo(TIMEZONE)

def get_gmail_service():
    """
    Authenticates and returns a Gmail API service object.
    """
    creds = None
    token_gmail_path = os.path.join(BASE_DIR, 'token_gmail.json')
    credentials_path = os.path.join(BASE_DIR, 'credentials.json')
    if os.path.exists(token_gmail_path):
        creds = Credentials.from_authorized_user_file(token_gmail_path, GMAIL_SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(credentials_path, GMAIL_SCOPES)
            creds = flow.run_local_server(port=0)
        with open(token_gmail_path, 'w') as token:
            token.write(creds.to_json())
    return build('gmail', 'v1', credentials=creds)

def get_calendar_service():
    """
    Authenticates and returns a Google Calendar API service object.
    """
    creds = None
    token_calendar_path = os.path.join(BASE_DIR, 'token_calendar.json')
    credentials_path = os.path.join(BASE_DIR, 'credentials.json')
    if os.path.exists(token_calendar_path):
        creds = Credentials.from_authorized_user_file(token_calendar_path, CALENDAR_SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(credentials_path, CALENDAR_SCOPES)
            creds = flow.run_local_server(port=0)
        with open(token_calendar_path, 'w') as token:
            token.write(creds.to_json())
    return build('calendar', 'v3', credentials=creds)

def get_gmail_and_calendar_services():
    """
    A helper function to get both Gmail and Calendar services.
    """
    return get_gmail_service(), get_calendar_service()

def analyze_email_with_gemini(email_content):
    """
    Uses Gemini to analyze an email for meeting details, with a refined prompt for
    reliable JSON output and an intelligent assumption for end time.
    """
    # Prefer environment variable if set; fallback to existing key
    genai_api_key = os.getenv('GEMINI_API_KEY', 'AIzaSyAUdI5WamGQwV1EJtkaIBECvOGk4RtlSFs')
    genai.configure(api_key=genai_api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
    now_local = datetime.now(LOCAL_TZ).isoformat()
    
    prompt = f"""
    Analyze the following email to determine if it is related to any meeting invitation.
    
    Always respond with a single JSON object. Do not include any other text, explanations, or Markdown formatting outside of the JSON.

    Try to understand the email content and extract the information. If there are no meeting attendees mentioned in the email, assume the sender is the only attendee and include their email address in the attendees list.

    If a meeting is found and a start time is present, populate the "meeting_details" key with the extracted information. If there is no year mentioned in the email, assume the meeting is scheduled for the current year.

    Context for relative terms: The current local date/time is {now_local} in timezone {TIMEZONE}. Interpret relative terms like "today", "tomorrow", or weekday names relative to this local time.

    Confirm the start time and date are in the future relative to the current local date and time above. If the extracted start time is in the past, leave the "meeting_details" key as an empty object and provide a concise reason in the "explanation" key.

    Confirm the start time and date before creating the calendar event.
    
    **Crucial instruction**: If an end time is not explicitly mentioned, assume the meeting duration is exactly one hour and set the "end_time" accordingly.
    
    If the email is not a meeting invitation or if no start time can be found, leave the "meeting_details" key as an empty object and provide a concise reason in the "explanation" key.

    Timezone and format requirements:
    - Assume the meeting is in timezone {TIMEZONE} unless another timezone/offset is explicitly provided.
    - Always output start_time and end_time in full ISO 8601 format INCLUDING timezone offset, e.g., 2025-09-19T15:00:00+03:00.

    The JSON object must have these keys:
    - explanation: A string explaining why the meeting could not be scheduled. This should be empty if the meeting is scheduled successfully.
    - meeting_details: An object with the following keys, populated only if a meeting is found:
        - subject: The meeting subject.
        - start_time: The start date and time in ISO 8601 format (YYYY-MM-DDTHH:mm:ss).
        - end_time: The end date and time in ISO 8601 format.
        - attendees: A list of email addresses for attendees.
        - location: The physical location. Use an empty string if not found.
        - online_meeting_url: The online meeting link. Use an empty string if not found.
    
    Email Content:
    {email_content}
    """
    try:
        response = model.generate_content(prompt)
        cleaned_response = re.search(r'\{.*\}', response.text, re.DOTALL)
        if cleaned_response:
            return cleaned_response.group(0)
        return json.dumps({
            "explanation": "Gemini returned malformed output that could not be parsed.",
            "meeting_details": {}
        })
    except Exception as e:
        print(f"Error analyzing email: {e}")
        return json.dumps({
            "explanation": f"An API error occurred: {str(e)}",
            "meeting_details": {}
        })

def get_unread_emails(service):
    """
    Retrieves all unread emails from the authenticated user's mailbox.
    """
    results = service.users().messages().list(userId='me', q="is:unread").execute()
    messages = results.get('messages', [])
    emails = []
    
    if not messages:
        print("No new unread messages.")
    else:
        for message in messages:
            msg = service.users().messages().get(userId='me', id=message['id'], format='full').execute()
            payload = msg['payload']
            headers = payload['headers']
            
            email_data = {
                'id': msg['id'],
                'from': '',
                'subject': '',
                'body': ''
            }
            
            for header in headers:
                if header['name'] == 'From':
                    email_data['from'] = header['value']
                if header['name'] == 'Subject':
                    email_data['subject'] = header['value']
                    
            if 'parts' in payload:
                parts = payload['parts']
                for part in parts:
                    if part['mimeType'] == 'text/plain':
                        body_data = part['body'].get('data', '')
                        email_data['body'] = base64.urlsafe_b64decode(body_data).decode('utf-8')
                        break
            
            emails.append(email_data)
    return emails

def create_calendar_event(service, event_details):
    """
    Creates a new event on the user's primary calendar with location and conference data.
    """
    # Helper to ensure datetimes are timezone-aware and in Helsinki timezone
    def _to_local_rfc3339(dt_str: str) -> str:
        if not dt_str:
            return dt_str
        cleaned = dt_str.strip()
        # Support trailing 'Z'
        if cleaned.endswith('Z'):
            cleaned = cleaned[:-1] + '+00:00'
        try:
            dt = datetime.fromisoformat(cleaned)
        except ValueError:
            # Try to add seconds if missing
            try:
                if re.match(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?:[+-]\d{2}:?\d{2})?$', cleaned):
                    # Insert :00 seconds before timezone part
                    cleaned2 = re.sub(r'(T\d{2}:\d{2})(?=[+-]\d{2}:?\d{2}$)', r'\1:00', cleaned)
                    dt = datetime.fromisoformat(cleaned2)
                else:
                    raise
            except Exception:
                raise

        if dt.tzinfo is None:
            # Treat naive times as local Helsinki time
            dt = dt.replace(tzinfo=LOCAL_TZ)
        else:
            # Convert any tz-aware time into Helsinki time
            dt = dt.astimezone(LOCAL_TZ)
        return dt.isoformat()

    # Normalize start/end to local RFC3339
    start_dt = _to_local_rfc3339(event_details.get('start_time'))
    end_dt = _to_local_rfc3339(event_details.get('end_time'))

    event = {
        'summary': event_details.get('subject', 'New Meeting'),
        'start': {
            'dateTime': start_dt,
            'timeZone': TIMEZONE,
        },
        'end': {
            'dateTime': end_dt,
            'timeZone': TIMEZONE,
        },
        'attendees': [{'email': a} for a in event_details.get('attendees', [])]
    }

    location = event_details.get('location')
    if location:
        event['location'] = location

    online_meeting_url = event_details.get('online_meeting_url')
    if online_meeting_url:
        event['description'] = f"Online meeting link: {online_meeting_url}"
        
        if "meet.google.com" in online_meeting_url:
            event['conferenceData'] = {
                'createRequest': {
                    'requestId': f"my-unique-id-{time.time()}",
                    'conferenceSolutionKey': {'type': 'hangoutsMeet'}
                }
            }

    try:
        event = service.events().insert(
            calendarId='primary',
            body=event,
            conferenceDataVersion=1
        ).execute()
        print(f"✅ Event created: {event.get('htmlLink')}")
    except Exception as e:
        print(f"❌ Error creating calendar event: {e}")

def mark_as_read(service, message_id):
    """
    Marks a specific email as read in Gmail.
    """
    try:
        service.users().messages().modify(
            userId='me',
            id=message_id,
            body={'removeLabelIds': ['UNREAD']}
        ).execute()
        print(f"Email {message_id} marked as read.")
    except Exception as e:
        print(f"Error marking email as read: {e}")

# Simple regex to validate a string as an email address
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

def main():
    """
    Main function to orchestrate the email processing workflow.
    """
    gmail_service, calendar_service = get_gmail_and_calendar_services()
    emails = get_unread_emails(gmail_service)
    
    if not emails:
        print("No new unread emails to process.")
        return

    for email in emails:
        print(f"🔎 Processing email from: {email['from']} with subject: {email['subject']}")
        
        analysis_result = analyze_email_with_gemini(email['body'])
        
        try:
            gemini_response = json.loads(analysis_result)
            explanation = gemini_response.get('explanation')
            event_details = gemini_response.get('meeting_details')
            
            if explanation:
                print(f"⚠️ Gemini couldn't schedule this meeting. Reason: {explanation}")
            elif event_details and event_details.get('start_time'):
                print("✅ Meeting details successfully extracted. Creating calendar event...")
                
                # Check for and calculate end_time if it's missing
                if not event_details.get('end_time'):
                    try:
                        start_str = event_details['start_time'].strip()
                        if start_str.endswith('Z'):
                            start_str = start_str[:-1] + '+00:00'
                        start_time_dt = datetime.fromisoformat(start_str)
                        if start_time_dt.tzinfo is None:
                            # Assume Helsinki local time if tz missing
                            start_time_dt = start_time_dt.replace(tzinfo=LOCAL_TZ)
                        # End time is 1 hour after start, preserving tz awareness
                        end_time_dt = start_time_dt + timedelta(hours=1)
                        event_details['end_time'] = end_time_dt.isoformat()
                        print("❗ End time not provided, defaulting to a 1-hour duration.")
                    except ValueError:
                        print("❌ Could not parse start_time to calculate end_time. Skipping calendar creation.")
                        continue # Skip to the next email

                # Corrected logic to validate and build the attendees list
                attendees = []
                # First, validate emails from Gemini's response
                for attendee_email in event_details.get('attendees', []):
                    if EMAIL_REGEX.match(attendee_email):
                        attendees.append(attendee_email)
                    else:
                        print(f"❗ Invalid attendee email from Gemini's response: '{attendee_email}'. Skipping.")

                # Second, add the sender's email if it's valid
                match = re.search(r'<(.*?)>', email['from'])
                if match:
                    sender_email = match.group(1)
                    if EMAIL_REGEX.match(sender_email) and sender_email not in attendees:
                        attendees.append(sender_email)

                # Update the event_details dictionary with the corrected attendees list
                event_details['attendees'] = attendees

                create_calendar_event(calendar_service, event_details)
            else:
                print("❗ Gemini returned an empty or incomplete response. Skipping.")
        
        except json.JSONDecodeError as e:
            print(f"❌ Failed to parse Gemini's response as JSON. Error: {e}. Raw response: {analysis_result}")
        except Exception as e:
            print(f"❌ An error occurred while processing the email: {e}")

        mark_as_read(gmail_service, email['id'])
        
        time.sleep(10)

if __name__ == '__main__':
    main()