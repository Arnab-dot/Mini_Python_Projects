from django.db import models

# Create your models here.
class Preference_list(models.Model):
    value=models.CharField(max_length=100)#this will store the places where the user wants to go
    description=models.CharField(max_length=100)#this will contain the description of the preference list the user can provide
    def __str__(self):
        return self.value

class Creating_group(models.Model):
    create_spid=models.CharField(max_length=100)#this will generate the name for the group which will be used as the table name for the group of friends with the same spid
    # write_spid=models.CharField(max_length=100)#if the friends have the same spid then the user will be added to the particular table
    def __str__(self):
        return self.create_spid

class IndividualFriend(models.Model):
    name=models.CharField(max_length=100)
    state_residence=models.CharField(max_length=100)
    city=models.CharField(max_length=100)
    choices=models.ForeignKey(Preference_list,on_delete=models.CASCADE)
    groups=models.ForeignKey(Creating_group,on_delete=models.CASCADE)

    def __str__(self):
        return self.name




