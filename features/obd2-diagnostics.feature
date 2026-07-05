Feature: OBD2 Diagnostics
  As a technician
  I want DTC capture and lookup
  So that faults convert to repair context

  Scenario: Known DTC enriches display
    Given DTC reference contains code "P0300"
    When I create an OBD2 snapshot for vehicle "v1" with codes "P0300"
    Then snapshot should include DTC "P0300" with description containing "ignition"

  Scenario: Unknown DTC still stored
    When I create an OBD2 snapshot for vehicle "v1" with codes "U0100"
    Then snapshot should include DTC "U0100" with description "Lost comm"

  Scenario: Link snapshot to job
    Given an OBD2 snapshot "snap1" for vehicle "v1"
    When I link snapshot "snap1" to job "j1"
    Then job "j1" obd2 summary should include "snap1"
