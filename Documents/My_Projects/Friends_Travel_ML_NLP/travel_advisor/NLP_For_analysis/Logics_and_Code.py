# NLP_For_analysis/Logics_and_Code.py
import pandas as pd
from textblob import TextBlob
from collections import Counter


def calculate_sentiment(text):

    if not text or text.strip() == '':
        return 0.0
    blob = TextBlob(text)
    return blob.sentiment.polarity


def normalize_score(score):

    return (score + 1) / 2


def predict_group_favorite(group_spid):

    from friends_joining.models import IndividualFriend, Creating_group

    try:
        group = Creating_group.objects.get(create_spid=group_spid)
        members = IndividualFriend.objects.filter(friend_group=group)

        if not members.exists():
            return None, 0.0, []

        all_destinations = []
        user_data = []

        for member in members:
            destinations = member.destinations or []

            if not destinations:
                continue

            # Collect all destinations and calculate sentiments
            member_destinations = []
            total_sentiment = 0

            for dest in destinations:
                dest_type = dest.get('type', '')
                dest_desc = dest.get('description', '')

                if dest_type:
                    all_destinations.append(dest_type)
                    sentiment = calculate_sentiment(dest_desc)
                    total_sentiment += sentiment

                    member_destinations.append({
                        'type': dest_type,
                        'description': dest_desc,
                        'sentiment': sentiment
                    })

            # Calculate average sentiment for this user
            avg_sentiment = total_sentiment / len(member_destinations) if member_destinations else 0
            normalized = normalize_score(avg_sentiment)

            user_data.append({
                'username': member.username,
                'state': member.state_residence,
                'city': member.city,
                'destinations': member_destinations,
                'avg_sentiment': avg_sentiment,
                'confidence': normalized
            })

        if not all_destinations:
            return None, 0.0, []

        # Find most common destination
        destination_counts = Counter(all_destinations)
        top_destination = destination_counts.most_common(1)[0][0]
        top_count = destination_counts.most_common(1)[0][1]

        # Calculate confidence
        agreement_confidence = top_count / len(all_destinations)
        avg_user_confidence = sum(u['confidence'] for u in user_data) / len(user_data)
        final_confidence = (agreement_confidence * 0.6) + (avg_user_confidence * 0.4)


        user_predictions = []
        for user in user_data:
            user_predictions.append({
                'username': user['username'],
                'destinations': [d['type'] for d in user['destinations']],
                'sentiment_score': float(user['avg_sentiment']),
                'confidence': float(user['confidence'])
            })

        return top_destination, float(final_confidence), user_predictions

    except Creating_group.DoesNotExist:
        return None, 0.0, []
    except Exception as e:
        print(f"Error in predict_group_favorite: {str(e)}")
        import traceback
        traceback.print_exc()
        return None, 0.0, []
