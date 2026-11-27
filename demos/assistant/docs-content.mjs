// Source text of the five sample PDFs. The company is fictional. Every figure here is invented, but kept consistent
// across the documents (delivery zones, leave days, limits), because the assistant is only as convincing as its sources.
// Block types: a plain string is a paragraph; { ul: [...] } a bullet list; { table: { head, rows, widths } } a table.

export const COMPANY = 'Tanjung Sampel Supplies'
export const FOOTER = 'Sample document. Fictional company, written by BorneoStack for demonstration.'

export const DOCS = [
  {
    file: 'staff-handbook.pdf',
    code: 'TSS-HR-01', owner: 'HR Manager', applies: 'All employees',
    title: 'Staff handbook',
    summary: 'Working hours, overtime, leave, expense claims and conduct for all employees.',
    intro:
      'This handbook applies to every employee of Tanjung Sampel Supplies, a fictional distributor of building materials and hardware in Sabah. It explains the rules you will use most: when you work, how to take leave and how to claim money you spent for the company. If a rule here conflicts with your employment contract, the contract applies.',
    sections: [
      {
        h: '1. Employment basics',
        blocks: [
          {
            h2: '1.1 Probation and confirmation',
            body: [
              'New employees serve a probation period of 3 months. The supervisor may extend probation once, by up to 3 more months, and must tell the employee in writing before the first 3 months end. Confirmation is in writing from the HR Manager.'
            ]
          },
          {
            h2: '1.2 Notice of resignation or termination',
            body: [
              'Notice depends on how long you have worked for the company. Notice may be paid in lieu if both sides agree.',
              {
                table: {
                  head: ['Length of service', 'Notice period'],
                  widths: [260, 235],
                  rows: [
                    ['During probation', '1 week'],
                    ['After confirmation, less than 2 years', '1 month'],
                    ['2 years or more', '2 months']
                  ]
                }
              }
            ]
          }
        ]
      },
      {
        h: '2. Working hours and overtime',
        blocks: [
          {
            h2: '2.1 Normal hours',
            body: [
              'Office staff work Monday to Friday, 8:30 am to 5:30 pm, with a one-hour lunch break from 12:30 pm to 1:30 pm. Warehouse staff and drivers work in a shift from 7:30 am to 4:30 pm, Monday to Friday, with a one-hour lunch break, and work every second Saturday from 7:30 am to 12:30 pm. The Saturday roster is published on the notice board by the 25th of the previous month.',
              'Everyone records attendance on the fingerprint clock at the start and end of the working day. Forgetting to clock in must be reported to the supervisor on the same day.'
            ]
          },
          {
            h2: '2.2 Lateness',
            body: [
              'A grace period of 10 minutes applies on up to 3 days in a calendar month. After that, each late arrival is recorded and deducted from pay in 15-minute steps. A supervisor may excuse lateness caused by a road closure or flood that affected many people.'
            ]
          },
          {
            h2: '2.3 Overtime',
            body: [
              'Overtime must be approved by your supervisor before you start. Overtime that was not approved is not paid. Employees who are paid by the month and earn up to RM4,000 are paid overtime at these rates of their hourly rate:',
              {
                table: {
                  head: ['Day', 'Overtime rate'],
                  widths: [260, 235],
                  rows: [
                    ['Normal working day', '1.5 times the hourly rate'],
                    ['Rest day', '2 times the hourly rate'],
                    ['Public holiday', '3 times the hourly rate']
                  ]
                }
              },
              'Overtime hours are entered on the monthly timesheet and signed by the supervisor. Timesheets are due at the HR office by the 5th of the next month. Late timesheets are paid in the following month.'
            ]
          }
        ]
      },
      {
        h: '3. Leave',
        blocks: [
          {
            h2: '3.1 Annual leave',
            body: [
              'Annual leave is paid. The number of days depends on your length of service on 1 January of each year, and is counted in working days.',
              {
                table: {
                  head: ['Length of service', 'Annual leave', 'Sick leave (outpatient)'],
                  widths: [200, 140, 155],
                  rows: [
                    ['Less than 2 years', '8 days', '14 days'],
                    ['2 years to less than 5 years', '12 days', '18 days'],
                    ['5 years or more', '16 days', '22 days']
                  ]
                }
              },
              'Unused annual leave of up to 5 days may be carried forward to the next year. Carried-forward days must be used by 31 March, after which they lapse without payment.'
            ]
          },
          {
            h2: '3.2 How to apply for annual leave',
            body: [
              {
                ul: [
                  'For 1 or 2 days, apply at least 3 working days before the first day of leave.',
                  'For 3 days or more, apply at least 14 days before the first day of leave.',
                  'Apply in the HR portal. Your supervisor approves or declines within 2 working days.',
                  'Leave is not approved during stocktake, which runs in the last week of June and the last week of December.'
                ]
              }
            ]
          },
          {
            h2: '3.3 Sick leave and hospitalisation',
            body: [
              'The number of paid sick leave days without hospital stay is in the table in 3.1. You must tell your supervisor by 9:00 am on the first day of absence, by phone or message, and give a medical certificate from a registered doctor on your return. If you are admitted to hospital, you receive up to 60 days of paid sick leave in a year, which includes the outpatient days.'
            ]
          },
          {
            h2: '3.4 Other paid leave',
            body: [
              {
                table: {
                  head: ['Type', 'Entitlement', 'Notes'],
                  widths: [130, 120, 245],
                  rows: [
                    ['Maternity leave', '98 consecutive days', 'Tell HR at least 30 days before the expected start.'],
                    ['Paternity leave', '7 consecutive days', 'For married male employees, within 14 days of the birth.'],
                    ['Compassionate leave', '3 days', 'Death of a spouse, child, parent or sibling.'],
                    ['Marriage leave', '3 days', 'Once during employment, with the invitation or certificate.']
                  ]
                }
              }
            ]
          },
          {
            h2: '3.5 Public holidays and unpaid leave',
            body: [
              'The company observes all federal and Sabah public holidays gazetted for the year, including the Kaamatan harvest festival on 30 and 31 May. The list is published every December. Unpaid leave of up to 30 days in a year may be approved by the General Manager. Emergency leave, for example after a serious accident at home, must be reported within 24 hours and is deducted from annual leave.'
            ]
          }
        ]
      },
      {
        h: '4. Claims and expenses',
        blocks: [
          {
            h2: '4.1 What you can claim',
            body: [
              'You may claim money you spent for company business when it was approved before the trip or purchase. The rates below apply to every employee.',
              {
                table: {
                  head: ['Expense', 'Rate or limit', 'Evidence needed'],
                  widths: [150, 175, 170],
                  rows: [
                    ['Mileage, own car', 'RM0.70 per km', 'Trip log with start, end and purpose'],
                    ['Meal allowance, outstation', 'RM30 per day', 'Outstation for more than 8 hours; no receipt'],
                    ['Hotel, one night', 'Up to RM180 in Kota Kinabalu, Sandakan or Tawau; up to RM150 elsewhere', 'Hotel invoice'],
                    ['Flights', 'Economy class, booked by the admin office', 'Booking confirmation'],
                    ['Toll and parking', 'Actual cost', 'Receipt or e-wallet statement'],
                    ['Mobile phone, sales staff', 'RM50 per month', 'None, paid with salary']
                  ]
                }
              },
              'Any single item above RM10 needs a receipt. Claims without a receipt are paid only if the Finance Manager accepts a written reason.'
            ]
          },
          {
            h2: '4.2 How and when to claim',
            body: [
              {
                ul: [
                  'Submit the claim form in the finance portal within 30 days of the date you spent the money. Claims older than 30 days are not paid.',
                  'Claims approved by the 20th of the month are paid with that month\'s salary. Claims approved after the 20th are paid in the next month.',
                  'A cash advance of up to RM1,000 can be requested for a trip. Settle it with receipts within 7 days of returning, or it is deducted from salary.'
                ]
              }
            ]
          },
          {
            h2: '4.3 Who approves',
            body: [
              {
                table: {
                  head: ['Claim total', 'Approved by'],
                  widths: [260, 235],
                  rows: [
                    ['Up to RM500', 'Your supervisor'],
                    ['RM500.01 to RM2,000', 'Your department head'],
                    ['More than RM2,000', 'The General Manager']
                  ]
                }
              }
            ]
          }
        ]
      },
      {
        h: '5. Pay, conduct and concerns',
        blocks: [
          {
            h2: '5.1 Payday',
            body: [
              'Salary is paid by bank transfer on the last working day of each month. The payroll cut-off is the 20th: changes to bank details, overtime and claims must reach HR by that date to be included. Payslips are sent to your company email on payday.'
            ]
          },
          {
            h2: '5.2 Gifts and conflicts of interest',
            body: [
              'Do not accept gifts worth more than RM100 from a customer or supplier. Declare any gift above RM100 to the HR Manager within 7 days, and expect to return it. Tell your supervisor if a family member owns or works for a customer or supplier.'
            ]
          },
          {
            h2: '5.3 Disciplinary steps',
            body: [
              'For most breaches the company uses four steps: a verbal warning, a written warning, a final written warning, then termination. Serious misconduct such as theft, violence or working under the influence of alcohol may lead to dismissal after an enquiry, without earlier steps. You may bring a colleague to any disciplinary meeting.'
            ]
          },
          {
            h2: '5.4 Raising a concern',
            body: [
              'Talk to your supervisor first. If that is not possible, write to the HR Manager at hr@tanjungsampel.example. Concerns about harassment, safety or fraud can also be sent to the General Manager. The company does not punish anyone for raising a concern in good faith.'
            ]
          }
        ]
      }
    ]
  },

  {
    file: 'delivery-procedure.pdf',
    code: 'TSS-OPS-02', owner: 'Dispatch supervisor', applies: 'Dispatch office, drivers and sales staff',
    title: 'Delivery procedure',
    summary: 'Order cut-off, delivery zones and charges, proof of delivery, damage reports and redelivery.',
    intro:
      'This procedure tells the dispatch office, drivers and sales staff how an order travels from confirmation to the customer\'s site. It also tells customers what to expect, so sales staff may quote it. Delivery runs Monday to Saturday from the Kota Kinabalu warehouse, and from the Sandakan and Tawau branches for the east coast.',
    sections: [
      {
        h: '1. Taking and confirming orders',
        blocks: [
          {
            h2: '1.1 Cut-off times',
            body: [
              'An order is confirmed when the customer has accepted the quotation and, for new customers, paid. Orders confirmed by 3:00 pm from Monday to Friday are delivered on the next working day in Zone A. Orders confirmed after 3:00 pm count as received on the next working day.',
              'For Saturday delivery in Zone A, the order must be confirmed by 11:00 am on Friday. There is no delivery on Sundays or public holidays.'
            ]
          },
          {
            h2: '1.2 Heavy and large orders',
            body: [
              'Orders of more than 100 bags of cement, more than 2 tonnes in total, or any item longer than 6 metres need 2 working days notice, because they need a crane truck or a second lorry. Sales staff must tell the customer when they quote.'
            ]
          }
        ]
      },
      {
        h: '2. Delivery zones, lead times and charges',
        blocks: [
          'The zone is decided by the delivery address. Charges are before any tax and are separate from goods prices in the price list.',
          {
            table: {
              head: ['Zone', 'Areas', 'Lead time', 'Delivery charge'],
              widths: [45, 195, 110, 145],
              rows: [
                ['A', 'Kota Kinabalu, Penampang, Putatan, Inanam', 'Next working day', 'RM25; free for orders of RM800 or more'],
                ['B', 'Tuaran, Papar, Kota Belud', '2 working days', 'RM60; free for orders of RM2,000 or more'],
                ['C', 'Ranau, Keningau, Kudat, Beaufort', '3 working days', 'RM120; free for orders of RM3,500 or more'],
                ['D', 'Sandakan, Tawau, Lahad Datu', '2 working days from branch stock; 5 working days from Kota Kinabalu', 'Branch stock: Zone A charges. From Kota Kinabalu: RM180 per pallet']
              ]
            }
          },
          'Zone D orders from Kota Kinabalu travel on the trunk truck, which leaves every Tuesday and Friday. An order confirmed after the Friday dispatch waits for the Tuesday truck.'
        ]
      },
      {
        h: '3. On the day of delivery',
        blocks: [
          {
            h2: '3.1 Delivery windows',
            body: [
              'Customers choose a morning window (8:30 am to 12:30 pm) or an afternoon window (1:30 pm to 5:30 pm). The dispatch office sends a message the evening before with the window and the driver\'s name. A driver may take at most 14 drops on one route.'
            ]
          },
          {
            h2: '3.2 Unloading',
            body: [
              'Drivers unload goods at the kerb or at a ground-floor point named by the customer, and the customer must have people ready to unload. Carrying goods upstairs or over more than 30 metres is not included. A helper can be booked in advance for RM50 per hour.'
            ]
          },
          {
            h2: '3.3 Proof of delivery',
            body: [
              {
                ul: [
                  'The customer, or a named person, signs the delivery order (DO) with name and signature, and the driver stamps it.',
                  'The driver takes one photo of the goods at the delivery point and uploads it with the signed DO by 6:00 pm on the same day.',
                  'The customer keeps one copy. The DO is the only proof that the goods arrived.'
                ]
              }
            ]
          }
        ]
      },
      {
        h: '4. Problems',
        blocks: [
          {
            h2: '4.1 Damage and shortages',
            body: [
              'The customer must check the goods at delivery and write any damage or shortage on the DO before signing. Damage or shortage found later must be reported to dispatch@tanjungsampel.example with photos within 24 hours of delivery. Reports after 24 hours are accepted only for damage that could not be seen at delivery, and not later than 3 days after delivery.'
            ]
          },
          {
            h2: '4.2 Wrong items',
            body: [
              'If the company delivered the wrong item, it collects it free of charge and delivers the right one at no extra delivery charge. The customer must report it within 7 days of delivery and the item must be unused and in its original packing.'
            ]
          },
          {
            h2: '4.3 Nobody to receive the goods',
            body: [
              'The driver waits 15 minutes and calls the customer twice. If nobody can receive the goods, the driver returns them to the warehouse and the order is booked for redelivery. A redelivery charge of RM40 applies in Zone A, and the normal zone charge applies elsewhere. A customer can move a delivery once without charge, if they tell the dispatch office before 12:00 noon on the working day before.'
            ]
          },
          {
            h2: '4.4 Late deliveries',
            body: [
              'If a delivery will arrive more than 2 hours after the end of its window, the dispatch office must call the customer before the window ends and give a new time. The company does not pay for losses caused by delay, but a late delivery in Zone A is free of the delivery charge when the delay was more than 4 hours.'
            ]
          }
        ]
      },
      {
        h: '5. Targets',
        blocks: [
          'The dispatch office reports these figures to the General Manager every month: deliveries on time within the window, target 95%; orders delivered complete and correct, target 99%; DOs uploaded by 6:00 pm on the day, target 100%. A driver whose DOs are late more than twice in a month is reminded by the dispatch supervisor.'
        ]
      }
    ]
  },

  {
    file: 'price-list-and-terms.pdf',
    code: 'TSS-SALES-03', owner: 'Sales Manager', applies: 'Sales counter staff and customers',
    title: 'Customer price list and terms of sale',
    summary: 'Sample prices for building materials and hardware, payment terms, discounts and returns.',
    intro:
      'Prices are in Ringgit Malaysia (RM), apply from 1 January 2026 and do not include any tax that applies. The company may change prices with 14 days notice to account customers. The list shows common items only; ask the sales counter for others. All prices and terms are invented for this sample.',
    sections: [
      {
        h: '1. Price list',
        blocks: [
          {
            h2: '1.1 Building materials',
            body: [
              {
                table: {
                  head: ['Item', 'Unit', 'Price (RM)'],
                  widths: [270, 125, 100],
                  rows: [
                    ['Portland composite cement', '50 kg bag', '21.50'],
                    ['Steel rebar T10', '6 m length', '27.80'],
                    ['Steel rebar T12', '6 m length', '38.50'],
                    ['Plywood 18 mm', '4 ft x 8 ft sheet', '98.00'],
                    ['Roofing zinc sheet 0.4 mm', '3 m sheet', '46.00'],
                    ['PVC pipe 4 inch', '3 m length', '29.90'],
                    ['Concrete block 4 inch', 'each', '1.80']
                  ]
                }
              }
            ]
          },
          {
            h2: '1.2 Hardware and site supplies',
            body: [
              {
                table: {
                  head: ['Item', 'Unit', 'Price (RM)'],
                  widths: [270, 125, 100],
                  rows: [
                    ['Emulsion paint, white', '18 litre pail', '215.00'],
                    ['Wire nails 3 inch', '25 kg box', '118.00'],
                    ['Safety helmet', 'each', '14.00'],
                    ['Work gloves, cotton', 'dozen pairs', '24.00'],
                    ['Padlock, 50 mm', 'each', '19.50'],
                    ['Cutting disc 4 inch', 'box of 25', '62.00']
                  ]
                }
              },
              'The company does not sell food, electrical appliances, air conditioners or furniture.'
            ]
          }
        ]
      },
      {
        h: '2. Quotations and orders',
        blocks: [
          {
            body: [
              'A written quotation is valid for 14 days from its date. After that the price may change. A quotation does not reserve stock; stock is reserved when the order is confirmed.',
              'Special orders are items not kept in stock, such as coloured roofing or cut steel. They need a 50% deposit when ordered, normally arrive in 3 weeks, and the deposit is not refunded once the supplier has been ordered. Delivery charges are set in the Delivery procedure and depend on the delivery zone.'
            ]
          }
        ]
      },
      {
        h: '3. Payment terms',
        blocks: [
          {
            h2: '3.1 New and cash customers',
            body: [
              'New customers pay before delivery by bank transfer, DuitNow QR or at the counter. Cheques are accepted for account customers only, and goods are released after the cheque clears.'
            ]
          },
          {
            h2: '3.2 Credit accounts',
            body: [
              'A customer may apply for a credit account after 3 months of regular purchases. Credit limits run from RM5,000 to RM50,000, depending on a review by the Finance Manager. Invoices on a credit account are due 30 days from the invoice date.'
            ]
          },
          {
            h2: '3.3 Late payment',
            body: [
              'Overdue invoices carry a late charge of 1.5% per month on the unpaid amount. Supply on credit stops when any invoice is more than 45 days overdue, until the overdue amount is paid. Price disputes must be raised within 7 days of the invoice date.'
            ]
          }
        ]
      },
      {
        h: '4. Volume discounts',
        blocks: [
          'Account customers receive a discount on the goods total of each invoice, based on their purchases in the previous calendar month. Delivery charges and special orders are not discounted.',
          {
            table: {
              head: ['Purchases in the previous month', 'Discount on goods'],
              widths: [300, 195],
              rows: [
                ['Less than RM5,000', 'None'],
                ['RM5,000 to RM14,999', '3%'],
                ['RM15,000 or more', '6%']
              ]
            }
          }
        ]
      },
      {
        h: '5. Returns and warranty',
        blocks: [
          {
            h2: '5.1 Returns',
            body: [
              'Goods that are unopened, undamaged and in stock condition may be returned within 7 days of delivery with the delivery order. A restocking fee of 10% of the goods price applies. Cut-to-size items, mixed paint and special orders cannot be returned.'
            ]
          },
          {
            h2: '5.2 Warranty',
            body: [
              'Building materials carry the manufacturer\'s warranty. Hand tools and safety equipment sold by the company carry a 6 month warranty against defects, but not against misuse or normal wear. To claim, bring the item and the invoice to any branch counter.'
            ]
          },
          {
            h2: '5.3 Counter hours',
            body: [
              'Branch counters are open Monday to Friday from 8:00 am to 5:00 pm and Saturday from 8:00 am to 1:00 pm. They are closed on Sundays and public holidays.'
            ]
          }
        ]
      }
    ]
  },

  {
    file: 'vehicle-safety-procedure.pdf',
    code: 'TSS-SAFE-04', owner: 'Safety Officer', applies: 'Drivers, forklift operators, workshop and dispatch',
    title: 'Vehicle and equipment safety procedure',
    summary: 'Daily checks, driving rules, forklift use, servicing and what to do after an accident.',
    intro:
      'This procedure covers the 14 delivery lorries (six 3-tonne lorries, five 5-tonne lorries, two crane trucks and one trunk truck) and the six forklifts at the Kota Kinabalu warehouse and the Sandakan and Tawau branches. It applies to drivers, forklift operators, the workshop and dispatch. The Safety Officer owns this document.',
    sections: [
      {
        h: '1. Before you drive',
        blocks: [
          {
            h2: '1.1 Daily pre-trip check',
            body: [
              'Every driver checks the vehicle before 7:45 am and signs the checklist. Look at: tyres and tyre pressure, lights and indicators, brakes, engine oil and water, mirrors, load straps and tailgate, fire extinguisher and warning triangle. A tyre with less than 1.6 mm of tread must be replaced before the vehicle leaves.',
              'If any item fails, do not drive. Tell the workshop supervisor and the dispatch office, who will give you another vehicle.'
            ]
          },
          {
            h2: '1.2 Licences and fitness',
            body: [
              'Drivers must hold the correct valid licence class for the vehicle. Drivers do not drive after taking medicine that causes drowsiness. The company has zero tolerance for alcohol or drugs: any driver may be tested at random before a shift, and a positive result means the driver does not drive and a disciplinary enquiry follows.'
            ]
          }
        ]
      },
      {
        h: '2. Driving rules',
        blocks: [
          {
            h2: '2.1 Speed and conduct',
            body: [
              {
                table: {
                  head: ['Place', 'Company speed limit'],
                  widths: [300, 195],
                  rows: [
                    ['Highways and trunk roads', '90 km/h, even where the road limit is higher'],
                    ['Towns and built-up areas', '60 km/h'],
                    ['Warehouse yards and branch sites', '10 km/h'],
                    ['Inside the warehouse building, forklifts', '8 km/h; 5 km/h near people']
                  ]
                }
              },
              'Seat belts are worn by everyone in the vehicle. A mobile phone must not be used while driving, including hands-free calls, because the dispatch office never calls a driver on the road; drivers stop in a safe place first.'
            ]
          },
          {
            h2: '2.2 Driving hours',
            body: [
              'A driver works no more than 10 hours of duty in one day and drives no more than 6 days in a week. Take a break of at least 30 minutes after every 4 hours of driving. Dispatch must plan routes so these limits can be kept.'
            ]
          },
          {
            h2: '2.3 Loads',
            body: [
              'Never load above the registered laden weight shown on the vehicle. The highest load, measured from the ground, is 3.8 metres. Load heavy items at the bottom and strap every load before moving. Cement is stacked no more than 10 bags high on a lorry. Steel longer than the bed must carry a red flag at the end.'
            ]
          },
          {
            h2: '2.4 Fuel and traffic fines',
            body: [
              'Use only the company fuel card and keep the receipt. Switch the engine off when refuelling. Fines for traffic offences committed while driving a company vehicle are paid by the driver. The driver must tell the dispatch office within 3 days of receiving a summons.'
            ]
          }
        ]
      },
      {
        h: '3. Forklifts and the yard',
        blocks: [
          'Only staff with a company forklift permit may operate a forklift. A permit is valid for 2 years and is renewed after a practical test with the Safety Officer. Before use, check the forks, chains, tyres, horn, lights and brakes, and record it in the forklift log.',
          {
            ul: [
              'Travel with the forks lowered, about 15 cm above the ground.',
              'Never carry passengers or lift people on the forks.',
              'Do not lift above the load rating on the plate.',
              'Safety shoes, a high-visibility vest and a helmet are worn in the yard. Gloves are worn when handling steel or zinc sheet.',
              'Park with the forks flat on the ground, the brake on and the key removed.'
            ]
          }
        ]
      },
      {
        h: '4. Servicing',
        blocks: [
          'Each lorry is serviced every 10,000 km or every 6 months, whichever comes first. Each forklift is serviced every 250 running hours. The workshop supervisor keeps the schedule and must remove a vehicle from service if it is more than 500 km or 14 days overdue. Any defect found on the road must be reported to dispatch the same day.'
        ]
      },
      {
        h: '5. Accidents and breakdowns',
        blocks: [
          {
            h2: '5.1 After an accident or near miss',
            body: [
              {
                ul: [
                  'Stop, switch on the hazard lights and check for injuries. Call 999 if anyone is hurt.',
                  'Do not admit fault and do not agree to settle in cash at the scene.',
                  'Take photos of the vehicles, the road and the damage, and note the names of witnesses.',
                  'Report to the Safety Officer by phone within 1 hour, even for a near miss or minor damage.',
                  'Give a written report within 24 hours, on the incident form.'
                ]
              }
            ]
          },
          {
            h2: '5.2 Breakdowns',
            body: [
              'Move the vehicle off the road if you can and switch on the hazard lights. Place the warning triangle at least 50 metres behind the vehicle. Call the dispatch office. Do not attempt roadside repairs other than changing a tyre when it is safe.'
            ]
          }
        ]
      }
    ]
  },

  {
    file: 'it-and-data-policy.pdf',
    code: 'TSS-IT-05', owner: 'IT Manager', applies: 'All employees and contractors',
    title: 'IT and data policy',
    summary: 'Passwords, devices, email, backups, how long records are kept and what to do after a data breach.',
    intro:
      'This policy covers company laptops, phones, email, the finance and order systems, and the personal data of customers and staff. It applies to every employee and contractor. The IT Manager owns this document. Questions go to the IT helpdesk at it@tanjungsampel.example.',
    sections: [
      {
        h: '1. Accounts and passwords',
        blocks: [
          'Every person has their own account. Never share a password or let someone else use your account. A password must have at least 12 characters. Passwords are changed only when there is a reason to think they are known to someone else, and are then changed within 1 working day. Multi-factor authentication is required for company email, the finance system and any access from outside the office.',
          'When a person leaves the company, the IT Manager disables all their accounts by 5:30 pm on their last working day, and the person returns all devices on the same day.'
        ]
      },
      {
        h: '2. Devices',
        blocks: [
          {
            h2: '2.1 Company laptops and phones',
            body: [
              'Company laptops have encrypted disks and lock after 5 minutes without use. Only IT installs software. Do not use removable USB drives, except encrypted drives issued by IT. If a device is lost or stolen, tell the IT helpdesk within 1 hour, so it can be locked and wiped.'
            ]
          },
          {
            h2: '2.2 Personal phones',
            body: [
              'A personal phone may be used for company email only if it has a screen lock with a PIN and the owner agrees that IT can remove company data from it. Customer lists, price files and ID numbers must not be saved on personal phones.'
            ]
          }
        ]
      },
      {
        h: '3. Email and sharing files',
        blocks: [
          'Email attachments are limited to 20 MB. Share larger files with a link from the company drive and set the link to named people. Do not send identity card numbers, bank account numbers or passwords by WhatsApp or personal email. Be careful with links and attachments you did not expect; forward them to it@tanjungsampel.example if you are unsure, and do not click them.'
        ]
      },
      {
        h: '4. Backups and keeping records',
        blocks: [
          {
            h2: '4.1 Backups',
            body: [
              'The order and finance systems are backed up every day at 2:00 am to an off-site cloud store. Daily backups are kept for 30 days and month-end backups for 12 months. IT tests a restore every quarter and records the result.'
            ]
          },
          {
            h2: '4.2 How long records are kept',
            body: [
              {
                table: {
                  head: ['Record', 'Kept for'],
                  widths: [300, 195],
                  rows: [
                    ['Customer, sales and finance records', '7 years'],
                    ['Staff records after leaving the company', '7 years'],
                    ['Proof-of-delivery photos', '12 months'],
                    ['CCTV recordings', '30 days'],
                    ['Credit applications that were declined', '12 months']
                  ]
                }
              },
              'After the period ends, the owner of the record deletes it and tells IT. Records needed for a dispute or an audit are kept until it is closed.'
            ]
          }
        ]
      },
      {
        h: '5. Personal data and breaches',
        blocks: [
          {
            h2: '5.1 Personal data',
            body: [
              'The company collects personal data only to take orders, deliver goods, review credit applications and employ staff. Staff open customer records only when their job needs it. A customer or staff member who asks to see their own data receives an answer within 21 days.'
            ]
          },
          {
            h2: '5.2 Reporting a breach',
            body: [
              'A data breach is any loss, theft or exposure of personal or company data, for example a lost laptop, an email sent to the wrong person or a stolen password. Report it to the IT Manager immediately and in any case within 4 hours of finding out. IT contains the problem, and the General Manager decides within 72 hours whether customers or authorities must be told.'
            ]
          }
        ]
      },
      {
        h: '6. Working away from the office',
        blocks: [
          {
            h2: '6.1 Remote access',
            body: [
              'Office and sales staff may work from home or on site with approval from their supervisor. Use only a company laptop, and connect to company systems with your own account and multi-factor authentication. Do not use public computers, such as those in hotels or internet cafes, to open company email or the finance system.'
            ]
          },
          {
            h2: '6.2 Public places and travel',
            body: [
              'Do not leave a laptop or phone unattended in a vehicle, a restaurant or a public place. Turn the screen away from other people when working in public. Customer files must not be copied to a personal computer or a personal cloud account.'
            ]
          }
        ]
      },
      {
        h: '7. Software, licences and the network',
        blocks: [
          'Staff request new software through the IT helpdesk. IT checks the licence and security, and installs it if approved. Pirated or unlicensed software is not allowed, and IT removes it when found. The office network has three parts: the office network for company laptops, a warehouse network for scanners and the order terminals, and a guest network. Nobody connects personal devices to the office or warehouse networks.',
          'IT installs security updates on company laptops every month. Staff must restart the laptop within 2 working days when asked, so the update can finish. IT may inspect company email and files to investigate a breach or a complaint, and will tell the staff member when it does.'
        ]
      },
      {
        h: '8. Getting help',
        blocks: [
          'The IT helpdesk answers requests from Monday to Friday, 8:30 am to 5:30 pm. A system that is down for the whole office is urgent: the target is to respond within 4 working hours. Other requests are answered by the next working day. Staff may use the company internet for reasonable personal use during breaks. The guest Wi-Fi is kept separate from the office network and must not be used for company work.'
        ]
      }
    ]
  }
]
