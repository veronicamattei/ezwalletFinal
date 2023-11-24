# Project Estimation - FUTURE
Date: 26/04/2023

Version: 2


# Estimation approach
<!-- Consider the EZWallet  project in FUTURE version (as proposed by the team), assume that you are going to develop the project INDEPENDENT of the deadlines of the course -->

<!--- modules - old ones plus: manage account, manage expenses, manage families, manage statistics chart, admin's functionalities--->
# Estimate by size
### 
|             | Estimate                        |             
| ----------- | ------------------------------- |  
| NC =  Estimated number of modules to be developed   |       14                      |             
|  A = Estimated average size per module, in LOC       |           200                 | 
| S = Estimated size of project, in LOC (= NM * A) | 2800 |
| E = Estimated effort, in person hours (here use productivity 10 LOC per person hour)  |        280                              |   
| C = Estimated cost, in euro (here use 1 person hour cost = 30 euro) | 8400 | 
| Estimated calendar time, in calendar weeks (Assume team of 4 people, 8 hours per day, 5 days per week ) |      1.75              |               

# Estimate by product decomposition
### 
|         component name    | Estimated effort (person hours)   |             
| ----------- | ------------------------------- | 
|requirement document    | 35 |
| GUI prototype | 25 |
|design document | 30 |
|code | 80 |
| unit tests | 40 |
| api tests | 53 |
| management documents  | 40 |



# Estimate by activity decomposition
### 
|         Activity name    | Estimated effort (person hours)   |             
| ----------- | ------------------------------- | 
| Perform work flow analysis | 8 |
| Identify user requirements | 12 |
| Identify interface requirements| 16 |
| Prepare requirements document | 32 |
| Prepare GUI prototype | 16 |
| Design units and classes | 16 |
| Design database | 32 |
| Development user's functionalities | 64 |
| Development admin's functionalities | 16 |
| Testing user's functionalities | 32 |
| Testing admin's functionalities | 16 |
| System test | 32 |
---
![Gantt Diagram](code/images/GanttV2.png)


# Summary
<!-- 
Report here the results of the three estimation approaches. The  estimates may differ. Discuss here the possible reasons for the difference -->

|             | Estimated effort                        |   Estimated duration |          
| ----------- | ------------------------------- | ---------------|
| estimate by size | 280 person hours | 1.8 calendar weeks |
| estimate by product decomposition | 303 person hours| 1.9 calendar weeks |
| estimate by activity decomposition | 292 person hours | 1.8 calendar weeks |


## Discussion
----
The estimated effort and duration vary depending on the method used, and this is due to the  fact that it's more accurate to estimate these values when more details are available. For example, the estimated effort by size is only based on the LOC number, while the estimatd effort by product decoposition is based on multiple phases such as the code development, api test, and unit tests. 

